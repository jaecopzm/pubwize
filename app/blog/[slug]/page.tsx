import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPost } from "@/lib/blog";
import { getCachedPosts } from "@/lib/blog-cache";
import { getRelatedPosts } from "@/lib/blog-related";
import { markdownToHtml } from "@/lib/wordpress/markdown";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, User, Share2 } from "lucide-react";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { CopyLinkButton } from "@/components/blog/copy-link-button";
import { ViewTracker } from "@/components/blog/view-tracker";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import type { DbPost } from "@/lib/blog";
import { BlogDetailNav } from "./blog-detail-nav";
import { AuthorCard } from "@/components/blog/author-card";
import { BackToTop } from "@/components/blog/back-to-top";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getCachedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  
  const url = `https://pubwize.com/blog/${slug}`;
  const ogImage = `https://pubwize.com/api/og?title=${encodeURIComponent(post.title)}${post.tags[0] ? `&tag=${encodeURIComponent(post.tags[0])}` : ""}&rt=${encodeURIComponent(post.readingTime)}`;

  return {
    title: `${post.title} — Pubwize Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      siteName: "Pubwize",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const allPosts = await getCachedPosts();
  const relatedPosts = getRelatedPosts(post, allPosts, 3);

  const isDbPost = "_source" in post && (post as DbPost)._source === "db";
  const articleId = isDbPost ? (post as DbPost).id : null;
  const ogImage = `https://pubwize.com/api/og?title=${encodeURIComponent(post.title)}${post.tags[0] ? `&tag=${encodeURIComponent(post.tags[0])}` : ""}&rt=${encodeURIComponent(post.readingTime)}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.coverImage || ogImage,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Pubwize",
      logo: {
        "@type": "ImageObject",
        url: "https://pubwize.com/pubwize-icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://pubwize.com/blog/${slug}`,
    },
  };

  return (
    <main className="min-h-screen aurora-bg noise-overlay">
      {articleId && <ViewTracker articleId={articleId} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ReadingProgress />
      
      <BlogDetailNav />
      <TableOfContents />

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-6 py-8 sm:py-12 lg:py-16">
        <div className="mb-6 sm:mb-8">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
            </div>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-6">
            {post.description}
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${tag}`} className="badge-gold text-xs hover:opacity-80 transition-opacity">{tag}</Link>
            ))}
          </div>

          {/* Featured Image */}
          {post.coverImage && (
            <div className="mt-6">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full max-h-[clamp(200px,50vw,480px)] object-cover rounded-xl"
                loading="eager"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

        {/* Article Content */}
        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none
          prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:scroll-mt-20
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
          prose-p:leading-relaxed prose-p:text-foreground/90
          prose-a:text-gold prose-a:no-underline prose-a:font-semibold hover:prose-a:underline hover:prose-a:underline-offset-4
          prose-strong:text-foreground prose-strong:font-bold
          prose-code:text-teal prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono-dm prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-surface-1 prose-pre:border prose-pre:border-border prose-pre:rounded-xl
          prose-ul:my-6 prose-li:my-2 prose-li:text-foreground/90
          prose-blockquote:border-l-4 prose-blockquote:border-gold prose-blockquote:bg-gold/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-foreground/90
        ">
          {isDbPost ? (
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content.replace(/\[IMAGE_SUGGESTION:[^\]]*\]/g, "")) }} />
          ) : (
            <MDXRemote source={post.content} />
          )}
        </div>

        {/* Bottom Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-10 mb-8" />

        <div className="space-y-5">
          {/* Share Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-5 px-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-gold" />
              <div>
                <p className="font-semibold text-sm text-foreground">Found this helpful?</p>
                <p className="text-xs text-muted-foreground">Share it with your team</p>
              </div>
            </div>
            <CopyLinkButton />
          </div>

          {/* Author */}
          <AuthorCard author={post.author} />

          {/* Newsletter */}
          <NewsletterSignup />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border/50 bg-card/30">
          <div className="max-w-4xl mx-auto px-6 py-10 sm:py-12 lg:py-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-6 bg-gradient-to-r from-gold to-teal rounded-full" />
              <h2 className="font-display text-xl sm:text-2xl font-bold">Continue Reading</h2>
            </div>
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                  <article className="h-full rounded-xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <time>{new Date(relatedPost.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{relatedPost.readingTime}</span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold mb-2 group-hover:text-gold transition-colors leading-tight">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {relatedPost.description}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <BackToTop />
    </main>
  );
}
