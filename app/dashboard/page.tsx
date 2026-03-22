"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  FileText,
  Globe,
  TrendingUp,
  Clock,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Layout,
  Copy,
  ChevronRight,
  Share2,
  ListTodo,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { UpgradeModal } from "@/components/upgrade-modal";
import { UsageMeter } from "@/components/pricing";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { useUsage } from "@/lib/hooks/use-usage";
import { useArticles } from "@/lib/hooks/use-swr-fetch";
import { UpgradeCTA } from "@/components/upgrade-cta";

interface Stats {
  totalArticles: number;
  totalSites: number;
  articlesThisMonth: number;
  lastActivity: Date | null;
  planTier: string;
  articlesByStatus: {
    brief: number;
    outline: number;
    draft: number;
    optimized: number;
  };
}

type ArticleStatus = 'brief' | 'outline' | 'draft' | 'optimized';

interface MiniArticle {
  id: string;
  keyword: string;
  status: ArticleStatus;
  updatedAt: Date;
}

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

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { data: usageData, loading: usageLoading } = useUsage();
  const { articles: allArticles, isLoading: articlesLoading } = useArticles();
  const [userName, setUserName] = useState("Writer");
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalSites: 0,
    articlesThisMonth: 0,
    lastActivity: null,
    planTier: "free",
    articlesByStatus: {
      brief: 0,
      outline: 0,
      draft: 0,
      optimized: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [hasWordPress, setHasWordPress] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        const idToken = await user?.getIdToken();
        if (!idToken) {
          setLoading(false);
          return;
        }

        // Prefer displayName, fall back to email prefix
        if (user?.displayName) {
          setUserName(user.displayName.split(" ")[0]);
        } else if (user?.email) {
          const prefix = user.email.split("@")[0].split(/[._-]/)[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }

        const [statsRes, wpSitesRes] = await Promise.all([
          fetch("/api/stats", { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch("/api/wordpress/sites", { headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : {};
        const wpSitesData = wpSitesRes.ok ? await wpSitesRes.json() : { sites: [] };

        setHasWordPress((wpSitesData.sites || []).length > 0);

        const extractCount = (val: unknown) => {
          if (typeof val === "number") return val;
          if (val && typeof val === "object" && "count" in val) return (val as { count: number }).count;
          return 0;
        };

        setStats({
          totalArticles: extractCount(statsData.totalArticles),
          totalSites: extractCount(statsData.totalSites),
          articlesThisMonth: extractCount(statsData.articlesThisMonth),
          lastActivity: statsData.lastActivity ? new Date(statsData.lastActivity._seconds * 1000) : null,
          planTier: statsData.planTier || "free",
          articlesByStatus: { brief: 0, outline: 0, draft: 0, optimized: 0 },
        });
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  async function duplicateArticle(articleId: string) {
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) return;

      const response = await fetch('/api/articles/duplicate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      if (!response.ok) throw new Error('Failed to duplicate');

      const data = await response.json();
      toast.success('Article duplicated successfully');
      router.push(`/dashboard/articles/${data.articleId}`);
    } catch (error) {
      toast.error('Failed to duplicate article');
    }
  }

  // Calculate article limit based on actual plan from usage data
  const currentPlan = usageData?.plan || stats.planTier || "free";
  const articleLimit = currentPlan === "pro" ? 100 : currentPlan === "starter" ? 25 : 5;
  const articlesUsed = usageData?.usage?.articlesUsed || stats.articlesThisMonth || 0;
  const rolloverArticles = usageData?.usage?.rolloverArticles || 0;
  const totalLimit = articleLimit + rolloverArticles;
  const usagePct = Math.min(100, (articlesUsed / totalLimit) * 100);
  const periodEnd = usageData?.periodEnd;

  const daysUntilReset = useMemo(() => {
    if (!periodEnd) return null;
    const endDate = periodEnd instanceof Date ? periodEnd : new Date(periodEnd as string);
    if (isNaN(endDate.getTime())) return null;
    const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [periodEnd]);

  const recentArticles = useMemo<MiniArticle[]>(() =>
    allArticles.slice(0, 5).map((a) => ({
      id: a.id,
      keyword: a.keyword,
      status: (a.status as ArticleStatus) || "brief",
      updatedAt: new Date(a.updatedAt?._seconds * 1000 || Date.now()),
    })),
    [allArticles]
  );

  const articlesByStatus = useMemo(() => ({
    brief: allArticles.filter((a) => a.status === 'brief').length,
    outline: allArticles.filter((a) => a.status === 'outline').length,
    draft: allArticles.filter((a) => a.status === 'draft').length,
    optimized: allArticles.filter((a) => a.status === 'optimized').length,
  }), [allArticles]);

  const monthlyTrend = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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

  const greeting = getGreeting();
  const animatedTotal = useCountUp(stats.totalArticles);
  const animatedSites = useCountUp(stats.totalSites);
  const animatedUsed = useCountUp(articlesUsed);

  if (loading || articlesLoading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-48 sm:w-64" />
            <Skeleton className="h-4 w-64 sm:w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 sm:w-32 rounded-xl" />
            <Skeleton className="h-10 w-28 sm:w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 sm:col-span-2 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 sm:h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 sm:h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Zap className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-gold text-sm px-4 py-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="mb-8 relative">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {greeting}, <span className="bg-gradient-to-r from-[#6366f1] to-[#22d3ee] bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
              {animatedUsed} of {totalLimit} articles used
              {rolloverArticles > 0 && <span className="text-[#22d3ee] ml-1">(+{rolloverArticles})</span>}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push("/dashboard/research")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border border-border bg-card/50 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all hover:border-[rgba(99,102,241,0.4)] hover:shadow-md text-muted-foreground hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Research
            </button>
            <button
              onClick={() => {
                if (articlesUsed >= totalLimit) {
                  setUpgradeReason(`You've reached your ${currentPlan} plan limit of ${articleLimit} articles/month`);
                  setShowUpgradeModal(true);
                } else {
                  router.push("/dashboard/articles/new");
                }
              }}
              className="flex-1 sm:flex-none btn-gold text-xs sm:text-sm px-3 py-2 sm:px-5 sm:py-2.5 justify-center"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              New Article
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      {stats.totalArticles < 3 && (
        <div className="mb-8">
          <OnboardingChecklist
            totalArticles={stats.totalArticles}
            totalSites={stats.totalSites}
            hasWordPress={hasWordPress}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Usage Card */}
        <div className="sm:col-span-2 group relative rounded-2xl border border-border p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-card hover:border-[rgba(99,102,241,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-transparent to-[#22d3ee]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex items-center gap-6">
            {/* Progress Ring */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="stroke-muted/30"
                  strokeWidth="6"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    usagePct > 80 ? 'stroke-red-500' : usagePct > 60 ? 'stroke-amber-500' : 'stroke-[#22d3ee]'
                  )}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - usagePct / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{Math.round(usagePct)}%</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">used</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-[#818cf8]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Quota</h3>
              </div>
              <p className="text-3xl font-black text-foreground mb-1">
                {animatedUsed} <span className="text-xl text-muted-foreground font-bold">/ {totalLimit}</span>
              </p>
              
              {/* Progress Bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-out rounded-full",
                    usagePct > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    usagePct > 60 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                    'bg-gradient-to-r from-[#22d3ee] to-[#6366f1]'
                  )}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {daysUntilReset !== null ? (
                  <>
                    Resets in <span className="font-bold text-foreground">{daysUntilReset}</span> {daysUntilReset === 1 ? 'day' : 'days'}
                    {currentPlan !== "pro" && (
                      <button
                        onClick={() => router.push("/dashboard/settings")}
                        className="ml-2 text-[#818cf8] hover:underline font-bold"
                      >
                        Upgrade →
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {currentPlan} plan
                    {currentPlan !== "pro" && (
                      <button
                        onClick={() => router.push("/dashboard/settings")}
                        className="ml-2 text-[#818cf8] hover:underline font-bold"
                      >
                        Upgrade →
                      </button>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Articles Card */}
        <div className="group relative rounded-2xl border border-border p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card hover:border-[rgba(99,102,241,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#22d3ee]" />
              </div>
              <TrendingUp className="h-5 w-5 text-[#22d3ee] opacity-50" />
            </div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Articles</p>
            <p className="text-4xl font-black text-foreground">{animatedTotal}</p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-[#22d3ee] font-bold">+{stats.articlesThisMonth}</span> this month
            </p>
          </div>
        </div>

        {/* Total Sites Card */}
        <div className="group relative rounded-2xl border border-border p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-card hover:border-[rgba(99,102,241,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center">
                <Globe className="h-6 w-6 text-[#a78bfa]" />
              </div>
              <Sparkles className="h-5 w-5 text-[#818cf8] opacity-50" />
            </div>
            <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 sm:mb-2">Connected Sites</p>
            <p className="text-2xl sm:text-4xl font-black text-foreground">{animatedSites}</p>
            <button
              onClick={() => router.push("/dashboard/sites")}
              className="text-[10px] sm:text-xs text-[#a78bfa] hover:underline font-bold mt-1 sm:mt-2"
            >
              Manage sites →
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Status Distribution with Mini Chart */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 mt-6 sm:mt-8">
        {[
          { label: "Brief", count: articlesByStatus.brief, icon: Sparkles, textColor: 'text-[#818cf8]', bgColor: 'bg-[#6366f1]/10' },
          { label: "Outline", count: articlesByStatus.outline, icon: TrendingUp, textColor: 'text-[#22d3ee]', bgColor: 'bg-[#22d3ee]/10' },
          { label: "Draft", count: articlesByStatus.draft, icon: FileText, textColor: 'text-[#a78bfa]', bgColor: 'bg-[#a78bfa]/10' },
          { label: "Optimized", count: articlesByStatus.optimized, icon: Sparkles, textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => router.push(`/dashboard/articles?status=${stat.label.toLowerCase()}`)}
            className="group relative rounded-lg sm:rounded-xl border p-3 sm:p-4 text-left transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-card to-card/50 overflow-hidden"
          >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity", stat.bgColor)} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.textColor)} />
                </div>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground mb-0.5 sm:mb-1">{stat.count}</p>
              <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3 relative z-10 w-full mt-6 sm:mt-8">
        {/* Pipeline / Recent Activity */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0">
          {/* Enhanced Monthly Trend Visualization */}
          <div className="mb-4 rounded-xl sm:rounded-2xl border p-4 sm:p-6 bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 via-transparent to-[#22d3ee]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="font-display text-base sm:text-xl font-black text-foreground mb-0.5 sm:mb-1">Content Production</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Last 6 months</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                  <span className="text-muted-foreground font-medium hidden xs:inline">Articles</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-24 sm:h-32">
                {monthlyTrend.map((item, idx) => {
                  const maxCount = Math.max(...monthlyTrend.map(t => t.count), 1);
                  const heightPct = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 group/bar">
                      <div className="relative w-full flex items-end justify-center h-20 sm:h-24">
                        <div
                          className="w-full rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500 cursor-pointer relative group-hover/bar:shadow-lg group-hover/bar:shadow-emerald-500/30"
                          style={{ height: `${Math.max(heightPct, 5)}%` }}
                        >
                          {item.count > 0 && (
                            <span className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-foreground opacity-0 group-hover/bar:opacity-100 transition-opacity">
                              {item.count}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-xs font-mono text-muted-foreground">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 sm:px-2">
            <h2 className="font-display text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 text-foreground">
              <Layout className="h-4 w-4 sm:h-5 sm:w-5 text-[#818cf8] shrink-0" />
              <span>Recent Articles</span>
            </h2>
            <button
              onClick={() => router.push("/dashboard/articles")}
              className="font-mono-dm flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all px-2.5 py-1 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#818cf8] hover:bg-[#6366f1]/20 hover:border-[#6366f1]/50 active:scale-95 touch-manipulation shrink-0"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3 w-full">
            {recentArticles.length === 0 ? (
              <div className="rounded-xl sm:rounded-2xl border border-dashed p-6 sm:p-8 lg:p-12 text-center bg-card border-border w-full">
                <Sparkles className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                <p className="text-xs sm:text-sm text-muted-foreground">No articles in the pipeline yet.</p>
                <button
                  onClick={() => router.push("/dashboard/articles/new")}
                  className="font-mono-dm mt-3 sm:mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:underline text-[#818cf8] active:scale-95 touch-manipulation"
                >
                  Start your first one →
                </button>
              </div>
            ) : (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="group flex cursor-pointer items-center justify-between rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all card-premium active:scale-[0.98] touch-manipulation w-full"
                >
                  <div
                    className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0 overflow-hidden"
                    onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                  >
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl transition-colors bg-muted text-muted-foreground shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-bold transition-colors text-foreground truncate">
                        {article.keyword}
                      </h4>
                      <div className="font-mono-dm mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="truncate">{timeAgo(article.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`font-mono-dm rounded-md sm:rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${article.status === "optimized"
                          ? 'bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20'
                          : 'bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20'
                        }`}
                    >
                      {article.status.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateArticle(article.id);
                      }}
                      className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-muted-foreground hover:text-[#818cf8] active:scale-95 touch-manipulation"
                      title="Duplicate article"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pro Tips */}
          <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium overflow-hidden relative w-full">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-20 w-20 sm:h-24 sm:w-24 rounded-full blur-2xl bg-[#6366f1]/10" />
            <h3 className="font-display text-base sm:text-lg font-bold flex items-center gap-2 mb-3 sm:mb-4 text-foreground relative z-10">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#818cf8] shrink-0" />
              <span>Pro Tips</span>
            </h3>
            <ul className="space-y-3 sm:space-y-4 relative z-10">
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#6366f1]" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Use the <strong className="text-foreground">Research Tool</strong> to find low-competition keywords before generating.
                </p>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#22d3ee]" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Export directly to <strong className="text-foreground">WordPress</strong> to save 20 mins per post on formatting.
                </p>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#a78bfa]" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Connect multiple sites to manage all your niche properties from one premium command center.
                </p>
              </li>
            </ul>
          </div>

          {/* New Research Study */}
          <button
            onClick={() => router.push("/dashboard/research")}
            className="group block w-full rounded-xl sm:rounded-2xl border p-4 sm:p-6 text-left transition-all border-[#6366f1]/20 bg-[#6366f1]/5 hover:bg-[#6366f1]/10 hover:border-[#6366f1]/40 active:scale-[0.98] touch-manipulation"
          >
            <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#818cf8]" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">New Research Study</h4>
            <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Discover untapped niche topics and cluster ideas.</p>
          </button>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Needs Repurposing Widget */}
          <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium bg-[#6366f1]/5 border-[#6366f1]/20 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30">
                  <Share2 className="h-4 w-4 text-[#818cf8]" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Needs Repurposing</h3>
              </div>
              <span className="badge-gold text-[10px]">Action Required</span>            </div>
            <div className="flex-1 space-y-3">
              {allArticles.filter(a => (a.status === 'optimized' || a.status === 'draft_generated') && !a.socialAssets).slice(0, 2).map((art, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border group hover:border-[#6366f1]/30 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/articles/${art.id}`)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{art.keyword}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Published • No social assets found</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#818cf8] transition-colors" />
                </div>
              ))}
              {allArticles.filter(a => (a.status === 'optimized' || a.status === 'draft_generated') && !a.socialAssets).length === 0 && (
                <div className="h-24 flex flex-center items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground italic">All published articles are fully repurposed! 🎉</p>
                </div>
              )}
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
              Repurposing increases traffic by 3.2x on average. Turn your best articles into social threads.
            </p>
          </div>

          {/* Content Roadmap Widget */}
          <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium bg-[#a78bfa]/5 border-[#a78bfa]/20 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a78bfa]/15 border border-[#a78bfa]/30">
                  <ListTodo className="h-4 w-4 text-[#a78bfa]" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Content Roadmap</h3>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-foreground">Next Cluster Article</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Based on your strategy, your next pillar support is missing.</p>
                  <button
                    onClick={() => router.push("/dashboard/research?mode=clusters")}
                    className="mt-2 text-[10px] font-bold text-[#a78bfa] hover:underline"
                  >
                    Generate cluster plan →
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border opacity-60">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-muted" />
                <div>
                  <p className="text-xs font-bold text-foreground">Automated Internal Linking</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Will be applied to 3 drafts in progress.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Meter */}
          {!usageLoading && usageData && (
            <UsageMeter
              plan={usageData.plan}
              articlesUsed={usageData.usage.articlesUsed}
              aiImprovementsUsed={usageData.usage.aiImprovementsUsed}
              sectionRegenerationsUsed={usageData.usage.sectionRegenerationsUsed}
              rolloverArticles={usageData.usage.rolloverArticles}
              socialGenerationsUsed={usageData.usage.socialGenerationsUsed || 0}
              onUpgrade={() => router.push("/dashboard/settings?tab=billing")}
            />
          )}
        </div>
      </div>

      {/* Upgrade CTA for Free Users - full width */}
      {usageData?.plan === 'free' && (
        <div className="mt-4 sm:mt-6">
          <UpgradeCTA 
            variant="card"
            reason="You're on the free plan. Upgrade to create 5x more content!"
          />
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />
    </div>
  );
}

