"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, Search, FileText, TrendingUp, Clock, Sparkles,
  Trash2, Copy, Download, Grid3x3, List, Eye,
  MoreVertical, Share2, CheckSquare, Square, Zap,
  Edit, X, BarChart3, Layers, PenLine, CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSites } from "@/lib/hooks/use-sites";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RepurposeButton } from "@/components/articles/repurpose-button";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  keyword: string;
  status: string;
  siteId: string;
  createdAt: Date;
  updatedAt?: Date;
  featuredImage?: string;
  wordCount?: number;
  views?: number;
}

type FilterStatus = "all" | "brief" | "outline" | "draft" | "optimized";
type ViewMode = "grid" | "list";
type SortBy = "recent" | "oldest" | "keyword" | "status";

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
  icon: React.ReactNode; progress: number;
}> = {
  brief:     { label: "Brief",     color: "#6366f1", bg: "bg-[#6366f1]/10", border: "border-[#6366f1]/20", icon: <BarChart3 className="h-3 w-3" />,    progress: 25  },
  outline:   { label: "Outline",   color: "#22d3ee", bg: "bg-[#22d3ee]/10", border: "border-[#22d3ee]/20", icon: <Layers className="h-3 w-3" />,       progress: 50  },
  draft:     { label: "Draft",     color: "#f59e0b", bg: "bg-amber-500/10",  border: "border-amber-500/20", icon: <PenLine className="h-3 w-3" />,      progress: 75  },
  optimized: { label: "Optimized", color: "#10b981", bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon:<CheckCircle2 className="h-3 w-3" />, progress: 100 },
  draft_generated: { label: "Draft", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <PenLine className="h-3 w-3" />, progress: 75 },
};

function getStatus(s: string) {
  return STATUS_CONFIG[s] ?? STATUS_CONFIG.brief;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatus(status);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      cfg.bg, cfg.border
    )} style={{ color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function WorkflowProgress({ status }: { status: string }) {
  const cfg = getStatus(status);
  return (
    <div className="w-full h-1 rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${cfg.progress}%`, background: cfg.color }}
      />
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function ArticleGridCard({
  article, siteName, selected, onSelect, onOpen, onDuplicate, onDelete,
}: {
  article: Article; siteName: string; selected: boolean;
  onSelect: () => void; onOpen: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const cfg = getStatus(article.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 card-premium hover:-translate-y-1 hover:shadow-2xl",
      selected ? "ring-2 ring-[#6366f1]/50 border-[#6366f1]/40 shadow-xl" : "border-border hover:border-[#6366f1]/30")}>
      <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn("absolute top-3 left-3 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
          selected ? "bg-[#6366f1] border-[#6366f1]" : "border-border bg-card/80 opacity-0 group-hover:opacity-100")}>
        {selected && <CheckSquare size={11} className="text-white" />}
      </button>
      <div ref={menuRef} className="absolute top-3 right-3 z-20">
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all">
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="absolute top-9 right-0 w-40 rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-2xl overflow-hidden z-30">
            <button onClick={(e) => { e.stopPropagation(); onOpen(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-[#6366f1]/10 transition-colors"><Edit className="h-3.5 w-3.5 text-[#818cf8]" /> Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-[#6366f1]/10 transition-colors"><Copy className="h-3.5 w-3.5 text-[#818cf8]" /> Duplicate</button>
            <div className="h-px bg-border mx-2" />
            <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
        )}
      </div>
      <div className="cursor-pointer flex flex-col flex-1" onClick={onOpen}>
        {article.featuredImage ? (
          <div className="relative h-44 overflow-hidden">
            <img src={article.featuredImage} alt={article.keyword} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3"><StatusBadge status={article.status} /></div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ background: `${cfg.color}15`, borderColor: `${cfg.color}25`, color: cfg.color }}><FileText className="h-5 w-5" /></div>
            <StatusBadge status={article.status} />
          </div>
        )}
        <div className="flex flex-col flex-1 p-5 pt-3 gap-3">
          <h3 className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-[#818cf8] transition-colors">{article.keyword}</h3>
          <WorkflowProgress status={article.status} />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{(article.wordCount || 0).toLocaleString()}w</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views || 0}</span>
            </div>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{article.updatedAt ? timeAgo(article.updatedAt) : timeAgo(article.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
        <RepurposeButton articleId={article.id} articleTitle={article.keyword} disabled={!["draft_generated", "optimized"].includes(article.status)} />
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ArticleListRow({
  article, siteName, selected, onSelect, onOpen, onDuplicate, onDelete,
}: {
  article: Article; siteName: string; selected: boolean;
  onSelect: () => void; onOpen: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const cfg = getStatus(article.status);
  return (
    <div className={cn("group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 card-premium cursor-pointer hover:border-[#6366f1]/30 hover:bg-[#6366f1]/5",
      selected && "ring-2 ring-[#6366f1]/40 border-[#6366f1]/30 bg-[#6366f1]/5")} onClick={onOpen}>
      <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn("w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all",
          selected ? "bg-[#6366f1] border-[#6366f1]" : "border-border hover:border-[#6366f1]/50")}>
        {selected && <CheckSquare size={11} className="text-white" />}
      </button>
      {article.featuredImage ? (
        <img src={article.featuredImage} alt={article.keyword} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center border" style={{ background: `${cfg.color}15`, borderColor: `${cfg.color}25`, color: cfg.color }}><FileText className="h-5 w-5" /></div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-[#818cf8] transition-colors truncate">{article.keyword}</p>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
          <span>{siteName || "—"}</span>
          <span>{(article.wordCount || 0).toLocaleString()}w</span>
          <span>{article.updatedAt ? timeAgo(article.updatedAt) : timeAgo(article.createdAt)}</span>
        </div>
        <div className="mt-1.5 w-28"><WorkflowProgress status={article.status} /></div>
      </div>
      <StatusBadge status={article.status} />
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={onDuplicate} className="p-1.5 rounded-lg text-muted-foreground hover:text-[#818cf8] hover:bg-[#6366f1]/10 transition-colors"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const searchRef = useRef<HTMLInputElement>(null);
  const { sitesMap } = useSites();
  const { plan } = useUserPlan();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles.map((a: any) => ({
            id: a.id, keyword: a.keyword, status: a.status, siteId: a.siteId,
            createdAt: new Date(a.createdAt?._seconds * 1000 || Date.now()),
            updatedAt: a.updatedAt ? new Date(a.updatedAt._seconds * 1000) : undefined,
            featuredImage: a.featuredImage, wordCount: a.wordCount || 0, views: a.views || 0,
          })));
        }
      } catch { toast.error("Failed to load articles"); } finally { setLoading(false); }
    };
    fetchArticles();
  }, []);

  // "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filteredArticles = articles
    .filter(a => a.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(a => filterStatus === "all" || a.status === filterStatus || (filterStatus === "draft" && a.status === "draft_generated"))
    .sort((a, b) => {
      switch (sortBy) {
        case "recent": return (b.updatedAt || b.createdAt).getTime() - (a.updatedAt || a.createdAt).getTime();
        case "oldest": return (a.updatedAt || a.createdAt).getTime() - (b.updatedAt || b.createdAt).getTime();
        case "keyword": return a.keyword.localeCompare(b.keyword);
        case "status": return a.status.localeCompare(b.status);
        default: return 0;
      }
    });

  const statusCounts = {
    all: articles.length,
    brief: articles.filter(a => a.status === "brief").length,
    outline: articles.filter(a => a.status === "outline").length,
    draft: articles.filter(a => a.status === "draft" || a.status === "draft_generated").length,
    optimized: articles.filter(a => a.status === "optimized").length,
  };

  function toggleSelectAll() {
    setSelectedArticles(selectedArticles.length === filteredArticles.length ? [] : filteredArticles.map(a => a.id));
  }
  function toggleSelect(id: string) {
    setSelectedArticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch("/api/articles/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: id }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Article duplicated");
      router.push(`/dashboard/articles/${data.articleId}`);
    } catch { toast.error("Failed to duplicate"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      await fetch(`/api/articles/${id}`, { method: "DELETE" });
      setArticles(prev => prev.filter(a => a.id !== id));
      setSelectedArticles(prev => prev.filter(x => x !== id));
      toast.success("Article deleted");
    } catch { toast.error("Failed to delete"); }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedArticles.length} articles? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedArticles.map(id => fetch(`/api/articles/${id}`, { method: "DELETE" })));
      setArticles(prev => prev.filter(a => !selectedArticles.includes(a.id)));
      setSelectedArticles([]);
      toast.success(`Deleted ${selectedArticles.length} articles`);
    } catch { toast.error("Failed to delete articles"); }
  }

  async function handleBulkDuplicate() {
    try {
      await Promise.all(selectedArticles.map(id => fetch("/api/articles/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: id }) })));
      setSelectedArticles([]); toast.success("Articles duplicated"); window.location.reload();
    } catch { toast.error("Failed to duplicate articles"); }
  }

  function exportToCSV() {
    const rows = filteredArticles.map(a => [a.keyword, a.status, sitesMap[a.siteId]?.siteName || "", a.createdAt.toLocaleDateString(), a.wordCount || 0, a.views || 0]);
    const csv = [["Keyword","Status","Site","Created","Words","Views"], ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = `articles-${Date.now()}.csv`; el.click();
    toast.success("Exported to CSV");
  }

  const FILTER_TABS: { status: FilterStatus; label: string; color: string }[] = [
    { status: "all",       label: "All",       color: "#94a3b8" },
    { status: "brief",     label: "Brief",     color: "#6366f1" },
    { status: "outline",   label: "Outline",   color: "#22d3ee" },
    { status: "draft",     label: "Draft",     color: "#f59e0b" },
    { status: "optimized", label: "Optimized", color: "#10b981" },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Content <span className="bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent">Library</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {articles.length} articles · {Object.keys(sitesMap).length} sites · {filteredArticles.reduce((s, a) => s + (a.wordCount || 0), 0).toLocaleString()} words
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {plan === "pro" && (
            <Link href="/dashboard/articles/bulk"
              className="flex items-center gap-1.5 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2.5 text-sm font-bold text-[#818cf8] transition-all hover:bg-[#6366f1]/20 hover:shadow-lg hover:shadow-[#6366f1]/20 active:scale-95">
              <Zap className="h-4 w-4" /> Bulk Create
            </Link>
          )}
          <button onClick={() => router.push("/dashboard/research")}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-[#6366f1]/40 hover:text-foreground hover:shadow-md active:scale-95">
            <Search className="h-4 w-4" /> Research
          </button>
          <button onClick={() => router.push("/dashboard/articles/new")}
            className="relative flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6366f1]/25 transition-all hover:scale-[1.02] hover:shadow-[#6366f1]/40 active:scale-95">
            <Plus className="h-4 w-4" /> New Article
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_TABS.map(tab => (
          <button key={tab.status} onClick={() => setFilterStatus(tab.status)}
            className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold whitespace-nowrap transition-all",
              filterStatus === tab.status
                ? "border-transparent text-white shadow-lg"
                : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
            )}
            style={filterStatus === tab.status ? { background: tab.color, boxShadow: `0 4px 20px ${tab.color}40` } : {}}>
            <span>{tab.label}</span>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-black",
              filterStatus === tab.status ? "bg-white/20" : "bg-muted")}
              style={filterStatus !== tab.status ? { color: tab.color } : {}}>
              {statusCounts[tab.status]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search & Controls ── */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#6366f1]" />
          <input
            ref={searchRef}
            placeholder='Search articles… (press "/" to focus)'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#6366f1]/50 focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {/* Sort */}
          <div className="flex rounded-xl border border-border bg-card overflow-hidden">
            {([["recent","New"],["oldest","Old"],["keyword","A-Z"]] as [SortBy,string][]).map(([v,l]) => (
              <button key={v} onClick={() => setSortBy(v)}
                className={cn("px-3 py-2 text-xs font-bold border-r border-border last:border-0 transition-colors",
                  sortBy === v ? "bg-[#6366f1]/15 text-[#818cf8]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                {l}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-border bg-card overflow-hidden">
            <button onClick={() => setViewMode("grid")}
              className={cn("p-2.5 transition-colors", viewMode === "grid" ? "bg-[#6366f1]/15 text-[#818cf8]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              <Grid3x3 size={16} />
            </button>
            <div className="w-px bg-border" />
            <button onClick={() => setViewMode("list")}
              className={cn("p-2.5 transition-colors", viewMode === "list" ? "bg-[#6366f1]/15 text-[#818cf8]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              <List size={16} />
            </button>
          </div>
          <button onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-muted-foreground hover:border-[#6366f1]/30 hover:text-foreground transition-all active:scale-95">
            <Download size={16} /><span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ── Result count + select all ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-foreground transition-colors font-semibold">
          {selectedArticles.length === filteredArticles.length && filteredArticles.length > 0
            ? <CheckSquare size={14} className="text-[#6366f1]" /> : <Square size={14} />}
          Select all
        </button>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"}
        </span>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : filteredArticles.length === 0 ? (
        searchQuery || filterStatus !== "all" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No matches found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try a different keyword or clear your filters.</p>
            <button 
              onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-border/50 p-12 lg:p-16 text-center relative overflow-hidden group"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-500/10 mb-6 relative"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                </motion.div>
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-foreground mb-3"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your Library is Waiting
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed"
              >
                Transform your ideas into rank-ready content. Start with a keyword and let AI handle the rest.
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto"
              >
                {[
                  { icon: BarChart3, label: "SEO Brief", desc: "Keyword research" },
                  { icon: Layers, label: "Smart Outline", desc: "Structured content" },
                  { icon: Zap, label: "AI Draft", desc: "Full article in minutes" },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <feature.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground mb-1">{feature.label}</p>
                    <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard/articles/new")}
                className="btn-gold px-6 py-3"
              >
                <Plus className="h-4 w-4" />
                Create Your First Article
              </motion.button>
            </div>
          </motion.div>
        )
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(a => (
            <ArticleGridCard key={a.id} article={a} siteName={sitesMap[a.siteId]?.siteName || ""}
              selected={selectedArticles.includes(a.id)} onSelect={() => toggleSelect(a.id)}
              onOpen={() => router.push(`/dashboard/articles/${a.id}`)}
              onDuplicate={() => handleDuplicate(a.id)} onDelete={() => handleDelete(a.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArticles.map(a => (
            <ArticleListRow key={a.id} article={a} siteName={sitesMap[a.siteId]?.siteName || ""}
              selected={selectedArticles.includes(a.id)} onSelect={() => toggleSelect(a.id)}
              onOpen={() => router.push(`/dashboard/articles/${a.id}`)}
              onDuplicate={() => handleDuplicate(a.id)} onDelete={() => handleDelete(a.id)} />
          ))}
        </div>
      )}

      {/* ── Bulk Action Toolbar ── */}
      {selectedArticles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#6366f1]/30 bg-card/90 backdrop-blur-2xl p-4 shadow-2xl shadow-[#6366f1]/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/20 text-[#818cf8] text-sm font-black">
                {selectedArticles.length}
              </div>
              <span className="text-xs font-bold text-foreground">selected</span>
              <button onClick={() => setSelectedArticles([])} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline">clear</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleBulkDuplicate}
                className="flex items-center gap-1.5 rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/10 px-3 py-2 text-xs font-bold text-[#818cf8] hover:bg-[#6366f1]/20 transition-all active:scale-95">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button onClick={() => toast.info("Bulk publish coming soon!")}
                className="flex items-center gap-1.5 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-3 py-2 text-xs font-bold text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-all active:scale-95">
                <Share2 className="h-3.5 w-3.5" /> Publish
              </button>
              <button onClick={handleBulkDelete}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
