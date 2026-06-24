"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Globe, TrendingUp, Clock, Plus, Search,
  ArrowRight, Sparkles, Zap, Copy, ChevronRight,
  BarChart3, AlertTriangle, CheckCircle2,
  PenLine, Layers
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/upgrade-modal";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { useUsage } from "@/lib/hooks/use-usage";
import { useArticles } from "@/lib/hooks/use-swr-fetch";
import { UpgradeCTA } from "@/components/upgrade-cta";
import { KPICard } from "@/components/dashboard/kpi-card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalArticles: number;
  totalSites: number;
  articlesThisMonth: number;
  lastActivity: Date | null;
  planTier: string;
}

type ArticleStatus = "brief" | "outline" | "draft" | "optimized";

interface MiniArticle {
  id: string;
  keyword: string;
  status: ArticleStatus;
  updatedAt: Date;
  siteName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  brief: { label: "Brief", color: "#6366f1", bg: "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20", icon: <BarChart3 className="h-3 w-3" /> },
  outline: { label: "Outline", color: "#22d3ee", bg: "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20", icon: <Layers className="h-3 w-3" /> },
  draft: { label: "Draft", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: <PenLine className="h-3 w-3" /> },
  optimized: { label: "Optimized", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
};

// ─── Area Chart ──────────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 100, H = 60, pad = 4;

  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - (d.count / max) * (H - pad * 2),
    ...d,
  }));

  const linePath = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H - pad} L ${pts[0].x},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#area-grad)" />
      <path d={linePath} stroke="#6366f1" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#6366f1" />
      ))}
    </svg>
  );
}

// ─── Article Row ──────────────────────────────────────────────────────────────

function ArticleRow({
  article,
  onOpen,
  onDuplicate,
}: {
  article: MiniArticle;
  onOpen: () => void;
  onDuplicate: () => void;
}) {
  const cfg = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.brief;

  return (
    <div
      className="group flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 hover:border-[#6366f1]/30 hover:bg-[#6366f1]/5 cursor-pointer active:scale-[0.99]"
      onClick={onOpen}
    >
      {/* Status dot + icon */}
      <div
        className={cn("flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg border text-xs", cfg.bg)}
      >
        {cfg.icon}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-semibold text-foreground">{article.keyword}</p>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
          <span className={cn("inline-flex items-center gap-0.5 sm:gap-1 rounded border px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold", cfg.bg)}>
            {cfg.label}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
            <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
            {timeAgo(article.updatedAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="rounded-md sm:rounded-lg p-1 sm:p-1.5 text-muted-foreground hover:text-[#818cf8] hover:bg-[#6366f1]/10 transition-colors"
          title="Duplicate"
        >
          <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>

      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground/40 group-hover:text-[#818cf8] group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-9 w-48 sm:w-56" />
          <Skeleton className="h-3 sm:h-4 w-64 sm:w-80" />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Skeleton className="h-9 sm:h-10 w-24 sm:w-28 rounded-lg" />
          <Skeleton className="h-9 sm:h-10 w-28 sm:w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 sm:h-36 rounded-lg" />)}
      </div>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <Skeleton className="h-44 sm:h-52 rounded-lg" />
          <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 sm:h-16 rounded-lg" />)}
        </div>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-44 sm:h-52 rounded-lg" />
          <Skeleton className="h-28 sm:h-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { data: usageData, loading: usageLoading } = useUsage();
  const { articles: allArticles, isLoading: articlesLoading } = useArticles();

  const [userName, setUserName] = useState("Writer");
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0, totalSites: 0, articlesThisMonth: 0,
    lastActivity: null, planTier: "free",
  });
  const [loading, setLoading] = useState(true);
  const [hasWordPress, setHasWordPress] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    if (!clerkLoaded || !clerkUser) return;
    const fetchData = async () => {
      try {
        const name = clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "Writer";
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        const [statsRes, wpRes] = await Promise.all([fetch("/api/stats"), fetch("/api/wordpress/sites")]);
        const statsData = statsRes.ok ? await statsRes.json() : {};
        const wpData = wpRes.ok ? await wpRes.json() : { sites: [] };
        setHasWordPress((wpData.sites || []).length > 0);
        const extract = (v: unknown) => typeof v === "number" ? v : (v && typeof v === "object" && "count" in v) ? (v as { count: number }).count : 0;
        setStats({
          totalArticles: extract(statsData.totalArticles),
          totalSites: extract(statsData.totalSites),
          articlesThisMonth: extract(statsData.articlesThisMonth),
          lastActivity: statsData.lastActivity ? new Date(statsData.lastActivity._seconds * 1000) : null,
          planTier: statsData.planTier || "free",
        });
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchData();
  }, [clerkLoaded, clerkUser]);

  async function duplicateArticle(articleId: string) {
    try {
      const res = await fetch("/api/articles/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Article duplicated");
      router.push(`/dashboard/articles/${data.articleId}`);
    } catch { toast.error("Failed to duplicate article"); }
  }

  // Derived usage values
  const currentPlan = usageData?.plan || stats.planTier || "free";
  const articleLimit = currentPlan === "pro" ? 100 : currentPlan === "starter" ? 25 : 5;
  const articlesUsed = usageData?.usage?.articlesUsed || stats.articlesThisMonth || 0;
  const rolloverArticles = usageData?.usage?.rolloverArticles || 0;
  const totalLimit = articleLimit + rolloverArticles;
  const usagePct = Math.min(100, (articlesUsed / totalLimit) * 100);
  const periodEnd = usageData?.periodEnd;

  const daysUntilReset = useMemo(() => {
    if (!periodEnd) return null;
    const end = periodEnd instanceof Date ? periodEnd : new Date(periodEnd as string);
    if (isNaN(end.getTime())) return null;
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [periodEnd]);

  const recentArticles = useMemo<MiniArticle[]>(() =>
    allArticles.slice(0, 6).map((a) => ({
      id: a.id,
      keyword: a.keyword,
      status: (a.status as ArticleStatus) || "brief",
      updatedAt: new Date(a.updatedAt?._seconds * 1000 || Date.now()),
    })), [allArticles]);

  const articlesByStatus = useMemo(() => ({
    brief: allArticles.filter((a) => a.status === "brief").length,
    outline: allArticles.filter((a) => a.status === "outline").length,
    draft: allArticles.filter((a) => a.status === "draft").length,
    optimized: allArticles.filter((a) => a.status === "optimized").length,
  }), [allArticles]);

  const monthlyTrend = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: MONTHS[date.getMonth()],
        count: allArticles.filter((a) => {
          const d = new Date(a.createdAt?._seconds * 1000 || 0);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        }).length,
      };
    });
  }, [allArticles]);

  const sparklineCounts = monthlyTrend.map(m => m.count);

  // Stale articles = stuck in brief/outline > 3 days
  const staleArticles = useMemo(() =>
    allArticles.filter((a) => {
      if (a.status !== "brief" && a.status !== "outline") return false;
      const updated = new Date(a.updatedAt?._seconds * 1000 || 0);
      return (Date.now() - updated.getTime()) > 3 * 24 * 60 * 60 * 1000;
    }).slice(0, 3), [allArticles]);

  // Pro tips carousel state
  const tips = [
    "Use the Research tool to find low-competition keywords before generating.",
    "Export directly to WordPress to save 20 minutes per post.",
    "Connect multiple sites to manage all niche properties from one command center.",
    "Articles with 1,500+ words rank 3x higher. Use the Draft panel to expand.",
  ];
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 4000);
    return () => clearInterval(t);
  }, [tips.length]);

  if (loading || articlesLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">

      {/* ── Hero Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
            {getGreeting()},{" "}
            <span style={{ color: "#6366f1" }}>
              {userName}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {articlesUsed} of {totalLimit} articles used this month
            {rolloverArticles > 0 && <span className="text-[#22d3ee] ml-1">(+{rolloverArticles} rollover)</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => router.push("/dashboard/research")}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-border bg-card px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:border-[#6366f1]/40 hover:text-foreground hover:shadow-md active:scale-[0.97]"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Research</span>
          </button>
          <button
            onClick={() => {
              if (articlesUsed >= totalLimit) {
                setUpgradeReason(`You've reached your ${currentPlan} plan limit`);
                setShowUpgradeModal(true);
              } else {
                router.push("/dashboard/articles/new");
              }
            }}
            className="relative flex items-center gap-1 sm:gap-1.5 overflow-hidden rounded-lg bg-[#6366f1] px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#6366f1]/25 transition-all hover:bg-[#5558e3] hover:shadow-[#6366f1]/40 hover:scale-[1.02] active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Article
          </button>
        </div>
      </div>

      {/* ── Onboarding ── */}
      {stats.totalArticles < 3 && (
        <OnboardingChecklist totalArticles={stats.totalArticles} totalSites={stats.totalSites} hasWordPress={hasWordPress} />
      )}

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
                  <div className="h-5 w-5 rounded bg-muted/50 animate-pulse" style={{ animationDelay: '150ms' }} />
                </div>
                <div className="h-8 w-16 rounded bg-muted/50 animate-pulse" style={{ animationDelay: '300ms' }} />
              </motion.div>
            ))}
          </>
        ) : (
          <>
            <KPICard label="Total Articles" value={stats.totalArticles} icon={<FileText className="h-5 w-5" />} accentColor="#6366f1" sparklineData={sparklineCounts} trend={stats.articlesThisMonth > 0 ? Math.round((stats.articlesThisMonth / Math.max(stats.totalArticles - stats.articlesThisMonth, 1)) * 100) : undefined} trendLabel="vs prev" onClick={() => router.push("/dashboard/articles")} />
            <KPICard label="This Month" value={articlesUsed} suffix={`/ ${totalLimit}`} icon={<Zap className="h-5 w-5" />} accentColor="#22d3ee" sparklineData={sparklineCounts} onClick={() => router.push("/dashboard/settings?tab=billing")} />
            <KPICard label="Connected Sites" value={stats.totalSites} icon={<Globe className="h-5 w-5" />} accentColor="#6366f1" onClick={() => router.push("/dashboard/sites")} />
            <KPICard label="Optimized" value={articlesByStatus.optimized} icon={<TrendingUp className="h-5 w-5" />} accentColor="#10b981" sparklineData={sparklineCounts} onClick={() => router.push("/dashboard/articles?status=optimized")} />
          </>
        )}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 min-w-0">

          {/* Area Chart */}
          <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 sm:p-5 transition-all hover:border-[#6366f1]/30 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-transparent to-[#22d3ee]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Content Velocity</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Articles published — last 6 months</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-[#6366f1]" /> <span className="hidden sm:inline">Articles</span>
                </div>
              </div>
              <div className="h-24 sm:h-32 w-full overflow-hidden"><AreaChart data={monthlyTrend} /></div>
              <div className="flex justify-between mt-2 overflow-x-auto scrollbar-hide">
                {monthlyTrend.map((m) => <span key={m.month} className="text-[9px] sm:text-[10px] font-mono text-muted-foreground whitespace-nowrap">{m.month}</span>)}
              </div>
            </div>
          </div>

          {/* Status Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {(["brief", "outline", "draft", "optimized"] as ArticleStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => router.push(`/dashboard/articles?status=${s}`)}
                  className="group flex flex-col gap-1.5 sm:gap-2 rounded-lg border p-2.5 sm:p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{ backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}20`, color: cfg.color }}>
                  <div className="flex items-center justify-between">{cfg.icon}<ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  <p className="text-xl sm:text-2xl font-black">{articlesByStatus[s]}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-70">{cfg.label}</p>
                </button>
              );
            })}
          </div>

          {/* Recent Articles */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="font-bold text-sm sm:text-base flex items-center gap-2 text-foreground"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#818cf8]" /> Recent Articles</h2>
              <button onClick={() => router.push("/dashboard/articles")} className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#818cf8] hover:bg-[#6366f1]/20 transition-all active:scale-95">
                View All <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentArticles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 sm:p-10 text-center">
                  <Sparkles className="mx-auto h-6 w-6 sm:h-7 sm:w-7 mb-2 sm:mb-3 text-muted-foreground opacity-30" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No articles yet.</p>
                  <button onClick={() => router.push("/dashboard/articles/new")} className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-bold text-[#818cf8] hover:underline">Create your first article →</button>
                </div>
              ) : (
                recentArticles.map((a) => (
                  <ArticleRow key={a.id} article={a} onOpen={() => router.push(`/dashboard/articles/${a.id}`)} onDuplicate={() => duplicateArticle(a.id)} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div className="space-y-4 sm:space-y-5 min-w-0">

          {/* Usage Donut */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 card-premium">
            <h3 className="font-bold text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-2 text-foreground"><Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#818cf8]" /> Monthly Quota</h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="34" strokeWidth="6" fill="none" className="stroke-muted/30" />
                  <circle cx="40" cy="40" r="34" strokeWidth="6" fill="none"
                    stroke={usagePct > 80 ? "#ef4444" : usagePct > 60 ? "#f59e0b" : "#22d3ee"}
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - usagePct / 100)}`}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-base sm:text-lg font-black">{Math.round(usagePct)}%</span></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-black truncate">{articlesUsed} <span className="text-sm sm:text-base font-semibold text-muted-foreground">/ {totalLimit}</span></p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{daysUntilReset !== null ? <>Resets in <strong className="text-foreground">{daysUntilReset}d</strong></> : `${currentPlan} plan`}</p>
                {currentPlan !== "pro" && <button onClick={() => router.push("/dashboard/settings")} className="mt-2 text-[9px] sm:text-[10px] font-bold text-[#818cf8] hover:underline whitespace-nowrap">Upgrade plan →</button>}
              </div>
            </div>
          </div>

          {/* Needs Action */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
            <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 text-foreground"><AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" /> Needs Action</h3>
            {staleArticles.length === 0 ? (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />All articles are progressing!</div>
            ) : (
              <div className="space-y-2">
                {staleArticles.map((a: any) => (
                  <button key={a.id} onClick={() => router.push(`/dashboard/articles/${a.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-amber-500/20 bg-card px-2.5 sm:px-3 py-2 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.98]">
                    <div className="min-w-0"><p className="truncate text-[10px] sm:text-xs font-semibold text-foreground">{a.keyword}</p><p className="text-[9px] sm:text-[10px] text-amber-500/80">Stalled at {a.status}</p></div>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-500/60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ready to Publish */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" /><h3 className="font-bold text-xs sm:text-sm text-foreground">Ready to Publish</h3></div>
            {articlesByStatus.optimized === 0 ? (
              <p className="text-[10px] sm:text-xs text-muted-foreground italic">No articles ready for publishing yet.</p>
            ) : (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {articlesByStatus.optimized} optimized article{articlesByStatus.optimized !== 1 ? 's' : ''} ready to publish
              </div>
            )}
          </div>

          {/* Pro Tips Carousel */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 card-premium overflow-hidden">
            <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 text-foreground"><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#818cf8]" /> Pro Tip</h3>
            <div className="min-h-[60px] sm:min-h-[48px]">
              <p key={tipIdx} className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">{tips[tipIdx]}</p>
            </div>
            <div className="flex gap-1 mt-2 sm:mt-3">
              {tips.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setTipIdx(i)} 
                  style={{
                    display: 'block',
                    height: '2px',
                    width: i === tipIdx ? '20px' : '8px',
                    backgroundColor: i === tipIdx ? '#6366f1' : 'hsl(var(--muted))',
                    borderRadius: '1px',
                    transition: 'all 0.3s',
                    padding: '0',
                    margin: '0',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: 'unset',
                    minHeight: 'unset',
                  }}
                />
              ))}
            </div>
          </div>

          {usageData?.plan === "free" && (
            <UpgradeCTA variant="card" reason="You're on the free plan. Upgrade to create 5x more content!" />
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} reason={upgradeReason} />
    </div>
  );
}
