"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, FileText, Filter, Calendar, TrendingUp, Clock, Sparkles,
  Trash2, Copy, Download, Star, Grid3x3, List, SortAsc, Eye, Edit,
  MoreVertical, Archive, Share2, CheckSquare, Square, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSites } from "@/lib/hooks/use-sites";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RepurposeButton } from "@/components/articles/repurpose-button";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import Link from "next/link";

interface Article {
  id: string;
  keyword: string;
  status: string;
  siteId: string;
  createdAt: Date;
  updatedAt?: Date;
  featuredImage?: string;
  featuredImageAttribution?: string;
  wordCount?: number;
  views?: number;
}

type FilterStatus = "all" | "brief" | "outline" | "draft" | "optimized";
type ViewMode = "grid" | "list";
type SortBy = "recent" | "oldest" | "keyword" | "status";

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const { sitesMap } = useSites();
  const { plan } = useUserPlan();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const auth = getFirebaseAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/articles", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const articlesData = data.articles.map((article: any) => ({
            id: article.id,
            keyword: article.keyword,
            status: article.status,
            siteId: article.siteId,
            createdAt: new Date(article.createdAt?._seconds * 1000 || Date.now()),
            updatedAt: article.updatedAt ? new Date(article.updatedAt._seconds * 1000) : undefined,
            featuredImage: article.featuredImage,
            featuredImageAttribution: article.featuredImageAttribution,
            wordCount: article.wordCount || 0,
            views: article.views || 0,
          }));
          setArticles(articlesData);
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        toast.error("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles
    .filter((article) =>
      article.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((article) =>
      filterStatus === "all" || article.status === filterStatus
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "keyword":
          return a.keyword.localeCompare(b.keyword);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const statusCounts = {
    all: articles.length,
    brief: articles.filter(a => a.status === "brief").length,
    outline: articles.filter(a => a.status === "outline").length,
    draft: articles.filter(a => a.status === "draft").length,
    optimized: articles.filter(a => a.status === "optimized").length,
  };

  async function exportToCSV() {
    const headers = ["Keyword", "Status", "Site", "Created", "Word Count", "Views"];
    const rows = filteredArticles.map(a => [
      a.keyword,
      a.status,
      sitesMap[a.siteId]?.siteName || "Unknown",
      a.createdAt.toLocaleDateString(),
      a.wordCount || 0,
      a.views || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `articles-${Date.now()}.csv`;
    a.click();
    toast.success("Exported to CSV");
  }

  async function handleBulkAction(action: string) {
    if (selectedArticles.length === 0) {
      toast.error("No articles selected");
      return;
    }

    if (action === "delete") {
      if (!confirm(`Delete ${selectedArticles.length} articles? This cannot be undone.`)) return;

      try {
        const auth = getFirebaseAuth();
        const idToken = await auth.currentUser?.getIdToken();

        await Promise.all(
          selectedArticles.map(id =>
            fetch(`/api/articles/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${idToken}` },
            })
          )
        );

        setArticles(articles.filter(a => !selectedArticles.includes(a.id)));
        setSelectedArticles([]);
        toast.success(`Deleted ${selectedArticles.length} articles`);
      } catch (error) {
        toast.error("Failed to delete articles");
      }
    } else if (action === "duplicate") {
      try {
        const auth = getFirebaseAuth();
        const idToken = await auth.currentUser?.getIdToken();

        await Promise.all(
          selectedArticles.map(id =>
            fetch('/api/articles/duplicate', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ articleId: id }),
            })
          )
        );

        setSelectedArticles([]);
        toast.success(`Duplicated ${selectedArticles.length} articles`);
        window.location.reload();
      } catch (error) {
        toast.error("Failed to duplicate articles");
      }
    }
  }

  function toggleSelectAll() {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(a => a.id));
    }
  }

  function toggleSelect(id: string) {
    if (selectedArticles.includes(id)) {
      setSelectedArticles(selectedArticles.filter(aid => aid !== id));
    } else {
      setSelectedArticles([...selectedArticles, id]);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto aurora-bg noise-overlay">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Content <span className="gradient-gold-teal">Library</span>
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">
            {articles.length} articles across {Object.keys(sitesMap).length} sites
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          {plan === 'pro' && (
            <Link
              href="/dashboard/articles/bulk"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 sm:px-4 py-2 text-sm font-semibold transition-all hover:bg-gold/20 text-gold"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden xs:inline">Bulk</span>
            </Link>
          )}
          <button
            onClick={() => router.push("/dashboard/research")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 sm:px-4 py-2 text-sm font-semibold transition-all hover:border-teal/30 hover:text-foreground text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden xs:inline">Research</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/articles/new")}
            className="flex-1 sm:flex-initial btn-gold text-sm px-3 sm:px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">New Article</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 relative z-10">
        {[
          { label: "All", count: statusCounts.all, status: "all" as FilterStatus, icon: FileText, color: 'text-muted-foreground' },
          { label: "Brief", count: statusCounts.brief, status: "brief" as FilterStatus, icon: Sparkles, color: 'text-gold' },
          { label: "Outline", count: statusCounts.outline, status: "outline" as FilterStatus, icon: TrendingUp, color: 'text-teal' },
          { label: "Draft", count: statusCounts.draft, status: "draft" as FilterStatus, icon: FileText, color: 'text-lilac' },
          { label: "Optimized", count: statusCounts.optimized, status: "optimized" as FilterStatus, icon: Sparkles, color: 'text-teal' },
        ].map((stat) => (
          <button
            key={stat.status}
            onClick={() => setFilterStatus(stat.status)}
            className={cn(
              "rounded-xl border p-3 sm:p-4 text-left transition-all card-premium",
              filterStatus === stat.status
                ? "border-gold/30 bg-gold/8 ring-2 ring-gold/20"
                : "border-border hover:border-gold/20"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("h-4 w-4", stat.color, "opacity-70")} />
              <span className="text-xl sm:text-2xl font-bold text-foreground">{stat.count}</span>
            </div>
            <p className="font-mono-dm text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Controls */}
      <div className="mb-6 space-y-3 relative z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="search-glow-wrapper flex-1">
            <div className="search-glow" />
            <div className="relative z-10">
              <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-12 h-11 sm:h-12 rounded-xl border border-border bg-card text-foreground"
              />
            </div>
          </div>

          {/* View Toggle & Export */}
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2.5 sm:p-3 transition-colors",
                  viewMode === "grid" ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2.5 sm:p-3 transition-colors border-l border-border",
                  viewMode === "list" ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List size={16} />
              </button>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold text-muted-foreground hover:border-gold/30 hover:text-foreground transition-all"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Sort & Select All */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all whitespace-nowrap flex-shrink-0"
            >
              {selectedArticles.length === filteredArticles.length && filteredArticles.length > 0 ? (
                <CheckSquare size={14} className="text-gold" />
              ) : (
                <Square size={14} />
              )}
              <span className="hidden sm:inline">Select All</span>
            </button>

            <div className="w-px h-5 bg-border flex-shrink-0" />

            <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">Sort:</span>
            {[
              { value: "recent", label: "Recent" },
              { value: "oldest", label: "Oldest" },
              { value: "keyword", label: "A-Z" },
              { value: "status", label: "Status" },
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => setSortBy(sort.value as SortBy)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                  sortBy === sort.value
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-border bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground"
                )}
              >
                {sort.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0 text-right sm:text-left">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          </span>
        </div>
      </div>

      {/* Bulk Actions Floating Toolbar */}
      {selectedArticles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-gold/30 bg-surface-1/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(245,166,35,0.15)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-teal/5 pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                  <span className="text-sm font-black">{selectedArticles.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-gold leading-none">Selected</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Articles for bulk action</span>
                </div>
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-muted-foreground hover:text-gold transition-colors underline underline-offset-4 decoration-border"
              >
                Deselect
              </button>
            </div>

            <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
              <button
                onClick={() => handleBulkAction('duplicate')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10 transition-all active:scale-95"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => toast.info("Bulk publish coming soon!")}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2 text-xs font-bold text-teal hover:bg-teal/10 transition-all active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span>Publish</span>
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-95"
                title="Delete Selected"
              >
                <Trash2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className={cn(
          "grid gap-3 sm:gap-4 relative z-10",
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-4 sm:p-5 flex flex-col bg-card min-h-[200px]">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                <div className="h-6 w-20 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <div className="h-5 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              </div>
              <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="group relative rounded-3xl border border-dashed border-border/60 p-12 sm:p-20 text-center overflow-hidden z-10">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-64 h-64 bg-gold/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-gold/10 transition-colors duration-1000" />
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-64 h-64 bg-teal/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-teal/10 transition-colors duration-1000" />
          
          <div className="relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-teal/20 p-[1px] mb-8 group-hover:scale-110 transition-transform duration-500">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-gold animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black font-display text-foreground mb-3">
              {searchQuery || filterStatus !== "all" ? "No matches found" : "Your Library is Waiting"}
            </h3>
            <p className="max-w-md mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed mb-10">
              {searchQuery || filterStatus !== "all"
                ? "We couldn't find any articles matching your search. Try a different keyword or check your filters."
                : "Transform your ideas into rank-ready content. Start by researching a keyword or creating your first AI-powered article."}
            </p>
            
            {(!searchQuery && filterStatus === "all") ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  className="btn-gold w-full sm:w-auto px-8 py-3.5 group"
                  onClick={() => router.push("/dashboard/articles/new")}
                >
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  Create First Article
                </button>
                <button
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-gold/30 transition-all font-semibold text-sm"
                  onClick={() => router.push("/dashboard/research")}
                >
                  Explore Keywords
                </button>
              </div>
            ) : (
              <button
                className="text-sm font-bold text-gold hover:text-gold-dim underline underline-offset-4"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className={cn(
                "group rounded-2xl border transition-all duration-300 card-premium overflow-hidden relative hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-gold/10",
                selectedArticles.includes(article.id) && "ring-2 ring-gold/50 border-gold/40 shadow-xl shadow-gold/5"
              )}
            >
              {/* Selection Checkbox */}
              <div
                className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleSelect(article.id)}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    selectedArticles.includes(article.id)
                      ? "bg-gold border-gold"
                      : "border-border bg-card/80 backdrop-blur-sm hover:border-gold/50"
                  )}
                >
                  {selectedArticles.includes(article.id) && (
                    <CheckSquare size={12} className="text-background" />
                  )}
                </button>
              </div>

              <div
                onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                className="cursor-pointer"
              >
                {/* Featured Image */}
                {article.featuredImage ? (
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden">
                    <img
                      src={article.featuredImage}
                      alt={article.keyword}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Glass Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={cn(
                        "font-mono-dm rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg transition-colors",
                        article.status === "optimized"
                          ? "bg-teal/20 text-teal border-teal/40 shadow-teal/10"
                          : article.status === "draft"
                            ? "bg-lilac/20 text-lilac border-lilac/40 shadow-lilac/10"
                            : "bg-gold/20 text-gold border-gold/40 shadow-gold/10"
                      )}>
                        {article.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/10 to-teal/10 border border-border/50 group-hover:border-gold/30 transition-colors shadow-inner">
                      <FileText className="h-6 w-6 text-muted-foreground group-hover:text-gold transition-colors" />
                    </div>
                    {/* Refined Badge */}
                    <div className={cn(
                      "font-mono-dm rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors",
                      article.status === "optimized"
                        ? "bg-teal/10 text-teal border-teal/20"
                        : article.status === "draft"
                          ? "bg-lilac/10 text-lilac border-lilac/20"
                          : "bg-gold/10 text-gold border-gold/20"
                    )}>
                      {article.status}
                    </div>
                  </div>
                )}

                <div className="p-5 pt-3">
                  <h3 className="text-base font-bold mb-3 line-clamp-2 leading-snug text-foreground group-hover:text-gold transition-colors">
                    {article.keyword}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/60">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground/60">Words</span>
                      <span className="text-sm font-bold text-foreground/90">{article.wordCount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground/60">Views</span>
                      <span className="text-sm font-bold text-foreground/90">{article.views || 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground/60">Site</span>
                      <span className="text-sm font-bold text-foreground/90 truncate">
                        {sitesMap[article.siteId]?.siteName?.slice(0, 10) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Repurpose Button */}
              <div
                className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0"
                onClick={(e) => e.stopPropagation()}
              >
                <RepurposeButton
                  articleId={article.id}
                  articleTitle={article.keyword}
                  disabled={!['draft_generated', 'optimized'].includes(article.status)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 relative z-10">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className={cn(
                "group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all card-premium cursor-pointer",
                selectedArticles.includes(article.id) && "ring-2 ring-gold/50"
              )}
              onClick={() => router.push(`/dashboard/articles/${article.id}`)}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(article.id);
                }}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                  selectedArticles.includes(article.id)
                    ? "bg-gold border-gold"
                    : "border-border hover:border-gold/50"
                )}
              >
                {selectedArticles.includes(article.id) && (
                  <CheckSquare size={12} className="text-background" />
                )}
              </button>

              {/* Thumbnail */}
              {article.featuredImage ? (
                <img
                  src={article.featuredImage}
                  alt={article.keyword}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-gold transition-colors truncate">
                  {article.keyword}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 shrink-0">
                    <FileText size={12} />
                    <span className="hidden xs:inline">{article.wordCount?.toLocaleString() || 0}</span>
                    <span className="xs:hidden">{(article.wordCount || 0) > 1000 ? `${Math.round((article.wordCount || 0) / 1000)}k` : article.wordCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Eye size={12} />
                    <span>{article.views || 0}</span>
                  </span>
                  <span className="hidden sm:inline truncate ml-1">{sitesMap[article.siteId]?.siteName || "Unknown"}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "font-mono-dm rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border shrink-0 transition-colors",
                article.status === "optimized"
                  ? "bg-teal/10 text-teal border-teal/20"
                  : article.status === "draft"
                    ? "bg-lilac/10 text-lilac border-lilac/20"
                    : "bg-gold/10 text-gold border-gold/20"
              )}>
                {article.status}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <RepurposeButton
                  articleId={article.id}
                  articleTitle={article.keyword}
                  disabled={!['draft_generated', 'optimized'].includes(article.status)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
