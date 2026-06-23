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
}

export interface DbPost extends Post {
  _source: "db";
}

function draftText(article: { draft: unknown }): string {
  if (!article.draft) return "";
  const d = article.draft as { content?: string };
  return d.content || "";
}

export async function getAllDbPosts(): Promise<DbPostMeta[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { blogPublishedAt: { not: null } },
      select: {
        blogSlug: true,
        keyword: true,
        metaTitle: true,
        metaDescription: true,
        blogPublishedAt: true,
        blogTags: true,
        draft: true,
        featuredImage: true,
        owner: { select: { displayName: true } },
      },
      orderBy: { blogPublishedAt: "desc" },
    });

    return articles.map((a) => {
      const content = draftText(a);
      return {
        _source: "db",
        slug: a.blogSlug!,
        title: a.metaTitle || a.keyword,
        description: a.metaDescription || content.slice(0, 200).replace(/#+\s*/g, "").trim() || "",
        date: a.blogPublishedAt!.toISOString(),
        author: a.owner.displayName || "Pubwize Team",
        tags: a.blogTags ? a.blogTags.split(",").filter(Boolean) : [],
        readingTime: content ? readingTime(content).text : "< 1 min read",
        coverImage: (a.featuredImage as { url?: string } | null)?.url,
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
        blogSlug: true,
        keyword: true,
        metaTitle: true,
        metaDescription: true,
        blogPublishedAt: true,
        blogTags: true,
        draft: true,
        featuredImage: true,
        owner: { select: { displayName: true } },
      },
    });

    if (!article || !article.blogPublishedAt) return null;

    const content = draftText(article);
    return {
      _source: "db",
      slug: article.blogSlug!,
      title: article.metaTitle || article.keyword,
      description: article.metaDescription || content.slice(0, 200).replace(/#+\s*/g, "").trim() || "",
      date: article.blogPublishedAt.toISOString(),
      author: article.owner.displayName || "Pubwize Team",
      tags: article.blogTags ? article.blogTags.split(",").filter(Boolean) : [],
      readingTime: content ? readingTime(content).text : "< 1 min read",
      coverImage: (article.featuredImage as { url?: string } | null)?.url,
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
