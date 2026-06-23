"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, ExternalLink, Clock, Trash2, Calendar,
  BookOpen, Search, RefreshCw, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  _source: "db";
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  author: string;
  siteName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unpublishing, setUnpublishing] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog/posts");
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Admin access required");
        } else {
          toast.error("Failed to load blog posts");
        }
        setPosts([]);
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      toast.error("Failed to load blog posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleUnpublish = async (post: BlogPost) => {
    if (!confirm(`Unpublish "${post.title}"? It will be removed from the public blog.`)) return;
    setUnpublishing(post.id);
    try {
      const res = await fetch("/api/admin/blog/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: post.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unpublish");
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success(`"${post.title}" unpublished`);
    } catch (err: any) {
      toast.error(err.message || "Failed to unpublish");
    } finally {
      setUnpublishing(null);
    }
  };

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
            Blog <span className="bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {posts.length} published {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-[#6366f1]/30 hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#6366f1]" />
        <input
          placeholder="Search posts by title or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-card text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#6366f1]/50 focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search ? "No matches found" : "No blog posts yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? "Try a different search term."
              : "Publish an article to the blog from the article editor to see it here."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-[#6366f1]/30 hover:shadow-md"
            >
              {/* Icon */}
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#818cf8]">
                <FileText className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className="text-sm font-bold text-foreground group-hover:text-[#818cf8] transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/articles/${post.id}`)}
                    >
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {post.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {post.slug}
                  </span>
                  <span>by {post.author}</span>
                  <span className="hidden sm:inline">· {post.siteName}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 transition-all"
                  title="View on blog"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => router.push(`/dashboard/articles/${post.id}`)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-[#818cf8] hover:bg-[#6366f1]/10 transition-all"
                  title="Edit article"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleUnpublish(post)}
                  disabled={unpublishing === post.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                  title="Unpublish from blog"
                >
                  {unpublishing === post.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
