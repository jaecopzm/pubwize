"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Trash2, Eye, AlertTriangle, XCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  description: string;
  slug: string;
  tags: string[];
  coverImage?: string;
  views: number;
  publishedAt: string;
  author: string;
  siteName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"unpublish" | "delete" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/blog/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.author.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : posts;

  async function confirmAction() {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "unpublish") {
        await fetch("/api/admin/blog/unpublish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: actionTarget }),
        });
      } else {
        await fetch("/api/admin/blog/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: actionTarget }),
        });
      }
      setPosts((prev) => prev.filter((p) => p.id !== actionTarget));
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
    setActionTarget(null);
    setActionType(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-teal/20 flex items-center justify-center">
          <FileText className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} published posts</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by title, author, slug, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/30 transition-all"
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {actionTarget && actionType && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-500">
              {actionType === "unpublish"
                ? "Unpublish this post from the blog?"
                : "Delete this post entirely? This cannot be undone."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setActionTarget(null); setActionType(null); }}
              className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              disabled={actionLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50",
                actionType === "unpublish"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-red-500 hover:bg-red-600"
              )}
            >
              {actionLoading ? "Processing..." : actionType === "unpublish" ? "Unpublish" : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-border bg-muted/30 text-xs font-mono-dm font-bold uppercase tracking-widest text-muted-foreground">
          <span className="col-span-2">Title</span>
          <span>Author</span>
          <span>Tags</span>
          <span>Views</span>
          <span>Published</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search ? "No posts match your search" : "No published posts yet"}
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="grid grid-cols-7 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center">
                {/* Title */}
                <div className="col-span-2 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">/{post.slug}</p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-gold/10 to-teal/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground truncate">{post.author}</span>
                </div>

                {/* Tags */}
                <div className="flex gap-1 flex-wrap">
                  {post.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] font-mono font-bold uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{post.tags.length - 2}</span>
                  )}
                </div>

                {/* Views */}
                <div className="text-sm font-semibold text-foreground">{post.views || 0}</div>

                {/* Published Date */}
                <div className="text-xs text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
                    title="View post"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => { setActionTarget(post.id); setActionType("unpublish"); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                    title="Unpublish"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setActionTarget(post.id); setActionType("delete"); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search ? "No posts match your search" : "No published posts yet"}
            </p>
          </div>
        ) : (
          filtered.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">/{post.slug}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground mb-1">Author</p>
                  <p className="font-semibold">{post.author}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Views</p>
                  <p className="font-semibold">{post.views || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Published</p>
                  <p className="font-semibold">{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tags</p>
                  <div className="flex gap-1 flex-wrap">
                    {post.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] font-mono font-bold uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </a>
                <button
                  onClick={() => { setActionTarget(post.id); setActionType("unpublish"); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Unpublish</span>
                </button>
                <button
                  onClick={() => { setActionTarget(post.id); setActionType("delete"); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
