import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { CopyLinkButton } from "@/components/blog/copy-link-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Pubwize Blog`,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.date },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const relatedPosts = allPosts.filter((p, i) => i !== currentIndex).slice(0, 2);

  return (
    <main className="min-h-screen aurora-bg noise-overlay">
      <ReadingProgress />
      
      {/* Back Navigation */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-gold transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to blog
          </Link>
        </div>
      </div>

      <TableOfContents />

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
        <div className="mb-8 sm:mb-12">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-6">
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
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8">
            {post.description}
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className="badge-gold text-xs">{tag}</span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-12" />

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
          <MDXRemote source={post.content} />
        </div>

        {/* Bottom Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-16 mb-12" />

        {/* Share Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 px-8 rounded-2xl border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Found this helpful?</p>
              <p className="text-xs text-muted-foreground">Share it with your team</p>
            </div>
          </div>
          <CopyLinkButton />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border/50 bg-card/30">
          <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-1 w-8 bg-gradient-to-r from-gold to-teal rounded-full" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Continue Reading</h2>
            </div>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                  <article className="h-full rounded-2xl border border-border bg-card p-6 sm:p-8 transition-all duration-300 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 hover:-translate-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <time>{new Date(relatedPost.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{relatedPost.readingTime}</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 group-hover:text-gold transition-colors leading-tight">
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
    </main>
  );
}
