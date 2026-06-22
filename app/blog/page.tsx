import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import { ArrowRight, Calendar, Clock, Sparkles, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Pubwize",
  description: "SEO strategies, AI content tips, and growth guides from the Pubwize team.",
  alternates: {
    types: { "application/rss+xml": "/blog/feed.xml" },
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  return (
    <main className="min-h-screen">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366f1]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#818cf8]" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#818cf8]">Pubwize Blog</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 max-w-3xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            SEO strategies that <span className="bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent">actually work</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            AI content tips, ranking strategies, and growth guides from the team building the future of SEO content.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-6">
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg text-muted-foreground">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Post */}
            {featuredPost && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-8 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] rounded-full" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Featured</span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <article className="relative rounded-3xl border border-border bg-card overflow-hidden transition-all duration-500 hover:border-[rgba(99,102,241,0.4)] hover:shadow-2xl hover:shadow-[#6366f1]/10 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.05)] via-transparent to-[rgba(34,211,238,0.05)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-10 lg:p-12">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
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
                      <h2 className="text-4xl lg:text-5xl font-black mb-4 group-hover:text-[#818cf8] transition-colors leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {featuredPost.title}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-3xl">
                        {featuredPost.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {featuredPost.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.1)] px-3 py-1 text-xs font-semibold text-[#818cf8]">{tag}</span>
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

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-1 w-8 bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] rounded-full" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Latest Articles</span>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  {regularPosts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                      <article className="h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-[rgba(99,102,241,0.4)] hover:shadow-xl hover:shadow-[#6366f1]/10 hover:-translate-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          <time>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{post.readingTime}</span>
                        </div>
                        <h3 className="text-2xl font-black mb-3 group-hover:text-[#818cf8] transition-colors leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1.5 flex-wrap">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[10px] font-mono font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#818cf8] group-hover:translate-x-1 transition-all" />
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
