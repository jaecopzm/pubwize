import Link from "next/link";
import { getCachedPosts, paginatePosts } from "@/lib/blog-cache";
import type { Metadata } from "next";
import { BlogHeader } from "./blog-header";
import { TagChip } from "@/components/blog/tag-chip";
import { ArrowRight, Calendar, Clock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Pubwize",
  description: "SEO strategies, AI content tips, and growth guides from the Pubwize team.",
  alternates: {
    types: { "application/rss+xml": "https://pubwize.com/blog/feed.xml" },
    canonical: "https://pubwize.com/blog",
  },
  openGraph: {
    title: "Blog — Pubwize",
    description: "SEO strategies, AI content tips, and growth guides from the Pubwize team.",
    type: "website",
    url: "https://pubwize.com/blog",
    siteName: "Pubwize",
    images: [
      {
        url: "https://pubwize.com/pubwize-social-img.png",
        width: 1200,
        height: 630,
        alt: "Pubwize Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Pubwize",
    description: "SEO strategies, AI content tips, and growth guides from the Pubwize team.",
    images: ["https://pubwize.com/pubwize-social-img.png"],
  },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  const { page: pageParam, tag } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

  const allPosts = await getCachedPosts();
  const filtered = tag
    ? allPosts.filter(p => p.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
    : allPosts;

  const { posts, totalPages, hasNext, hasPrev } = paginatePosts(filtered, currentPage);
  const featuredPost = currentPage === 1 && !tag ? posts[0] : null;
  const regularPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <main className="min-h-screen">
      <BlogHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366f1]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <img src="/pubwize-icon.png" alt="Pubwize" width={28} height={28} className="block" />
            <span className="text-lg font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-1, #e8e8f0)" }}>
              Pubwize
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#818cf8] group-hover:opacity-80 transition-opacity">/ Blog</span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 max-w-3xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            SEO strategies that <span className="bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent">actually work</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            AI content tips, ranking strategies, and growth guides from the team building the future of SEO content.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-14">
        {/* Tag filter indicator */}
        {tag && (
          <div className="flex items-center gap-3 mb-6">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← All posts</Link>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.1)] px-3 py-1 text-xs font-semibold text-[#818cf8]">{tag}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Sparkles className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-base text-muted-foreground">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Post */}
            {featuredPost && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-6 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-full" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Featured</span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <article className="relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-[rgba(99,102,241,0.4)] hover:shadow-xl hover:shadow-[#6366f1]/10 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.05)] via-transparent to-[rgba(34,211,238,0.05)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {featuredPost.coverImage && (
                      <div className="relative h-48 lg:h-64 overflow-hidden">
                        <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover" loading="eager" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                      </div>
                    )}
                    <div className="relative p-8 lg:p-10">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <time>{new Date(featuredPost.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{featuredPost.readingTime}</span>
                        </div>
                      </div>
                      <h2 className="text-3xl lg:text-4xl font-black mb-3 group-hover:text-[#818cf8] transition-colors leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {featuredPost.title}
                      </h2>
                      <p className="text-base text-muted-foreground mb-4 leading-relaxed max-w-3xl">
                        {featuredPost.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {featuredPost.tags.slice(0, 3).map((t) => (
                            <TagChip key={t} tag={t} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.1)] px-3 py-0.5 text-xs font-semibold text-[#818cf8] hover:bg-[rgba(99,102,241,0.2)] transition-colors cursor-pointer" />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#818cf8] group-hover:gap-3 transition-all">
                          <span>Read article</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </section>
            )}

            {/* Posts Grid */}
            {regularPosts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-6 bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] rounded-full" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {tag ? `Posts tagged "${tag}"` : "Latest Articles"}
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regularPosts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                      <article className="h-full rounded-xl border border-border bg-card transition-all duration-200 hover:border-[rgba(99,102,241,0.4)] hover:shadow-lg hover:shadow-[#6366f1]/10 hover:-translate-y-1 overflow-hidden">
                        {post.coverImage && (
                          <div className="relative h-36 overflow-hidden">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            <time>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                            <span>·</span>
                            <Clock className="h-3 w-3" />
                            <span>{post.readingTime}</span>
                          </div>
                          <h3 className="text-lg font-black mb-2 group-hover:text-[#818cf8] transition-colors leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5 flex-wrap">
                              {post.tags.slice(0, 2).map((t) => (
                                <TagChip key={t} tag={t} className="text-[10px] font-mono font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md text-muted-foreground hover:text-[#818cf8] transition-colors cursor-pointer" />
                              ))}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#818cf8] group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Link
                  href={`/blog?page=${currentPage - 1}${tag ? `&tag=${tag}` : ""}`}
                  aria-disabled={!hasPrev}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${hasPrev ? "border-border bg-card hover:border-[#6366f1]/40" : "pointer-events-none border-border/40 opacity-40"}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/blog?page=${p}${tag ? `&tag=${tag}` : ""}`}
                    className={`inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-all ${p === currentPage ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-border bg-card hover:border-[#6366f1]/40"}`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={`/blog?page=${currentPage + 1}${tag ? `&tag=${tag}` : ""}`}
                  aria-disabled={!hasNext}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${hasNext ? "border-border bg-card hover:border-[#6366f1]/40" : "pointer-events-none border-border/40 opacity-40"}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
