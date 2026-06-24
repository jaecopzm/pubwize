import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { prisma } from "@/lib/prisma";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: string;
  coverImage?: string;
  views?: number;
}

export interface Post extends PostMeta {
  content: string;
}

// ── MDX sources ──────────────────────────────────────────────

function getMdxPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        author: data.author ?? "Pubwize Team",
        tags: data.tags ?? [],
        readingTime: readingTime(content).text,
        coverImage: data.coverImage,
      };
    });
}

function getMdxPost(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    author: data.author ?? "Pubwize Team",
    tags: data.tags ?? [],
    readingTime: readingTime(content).text,
    coverImage: data.coverImage,
    content,
  };
}

// ── Database sources ─────────────────────────────────────────

export interface DbPostMeta extends PostMeta {
  _source: "db";
  id: string;
}

export interface DbPost extends Post {
  _source: "db";
  id: string;
}

function draftText(article: { draft: unknown }): string {
  if (!article.draft) return "";
  try {
    const d = article.draft as { content?: string };
    const content = d.content || "";
    return content.replace(/\[IMAGE_SUGGESTION:[^\]]*\]/g, "");
  } catch {
    return "";
  }
}

function generateExcerpt(content: string, maxLength = 200): string {
  const cleaned = content
    .replace(/^#+\s+/gm, "") // Remove markdown headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Extract link text
    .replace(/[*_~`]/g, "") // Remove markdown formatting
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) + "..." : truncated + "...";
}

export async function getAllDbPosts(): Promise<DbPostMeta[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { blogPublishedAt: { not: null } },
      select: {
        id: true,
        blogSlug: true,
        keyword: true,
        metaTitle: true,
        metaDescription: true,
        blogPublishedAt: true,
        blogTags: true,
        draft: true,
        featuredImage: true,
        views: true,
        owner: { select: { displayName: true } },
      },
      orderBy: { blogPublishedAt: "desc" },
    });

    return articles.map((a) => {
      const content = draftText(a);
      const excerpt = a.metaDescription || (content ? generateExcerpt(content) : "");
      return {
        _source: "db" as const,
        id: a.id,
        slug: a.blogSlug!,
        title: a.metaTitle || a.keyword,
        description: excerpt,
        date: a.blogPublishedAt!.toISOString(),
        author: a.owner.displayName || "Pubwize Team",
        tags: a.blogTags ? a.blogTags.split(",").filter(Boolean) : [],
        readingTime: content ? readingTime(content).text : "1 min read",
        coverImage: (a.featuredImage as { url?: string } | null)?.url,
        views: a.views,
      };
    });
  } catch {
    return [];
  }
}

export async function getDbPost(slug: string): Promise<DbPost | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { blogSlug: slug },
      select: {
        id: true,
        blogSlug: true,
        keyword: true,
        metaTitle: true,
        metaDescription: true,
        blogPublishedAt: true,
        blogTags: true,
        draft: true,
        featuredImage: true,
        views: true,
        owner: { select: { displayName: true } },
      },
    });

    if (!article || !article.blogPublishedAt) return null;

    const content = draftText(article);
    const excerpt = article.metaDescription || (content ? generateExcerpt(content) : "");
    return {
      _source: "db" as const,
      id: article.id,
      slug: article.blogSlug!,
      title: article.metaTitle || article.keyword,
      description: excerpt,
      date: article.blogPublishedAt.toISOString(),
      author: article.owner.displayName || "Pubwize Team",
      tags: article.blogTags ? article.blogTags.split(",").filter(Boolean) : [],
      readingTime: content ? readingTime(content).text : "1 min read",
      coverImage: (article.featuredImage as { url?: string } | null)?.url,
      views: article.views,
      content,
    };
  } catch {
    return null;
  }
}

// ── Merged public API ────────────────────────────────────────

export async function getAllPosts(): Promise<PostMeta[]> {
  const mdx = getMdxPosts();
  const db = await getAllDbPosts();
  return [...mdx, ...db].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  // MDX takes precedence
  const mdx = getMdxPost(slug);
  if (mdx) return mdx;
  return getDbPost(slug);
}
