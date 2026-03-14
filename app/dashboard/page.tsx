"use client";

import { useEffect, useState } from "react";
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
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { UpgradeModal } from "@/components/upgrade-modal";
import { UsageMeter } from "@/components/pricing";
import { useUsage } from "@/lib/hooks/use-usage";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
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

interface MiniArticle {
  id: string;
  keyword: string;
  status: string;
  updatedAt: Date;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { data: usageData, loading: usageLoading } = useUsage();
  const { periodEnd } = useUserPlan(); // Get periodEnd from SWR hook
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
  const [recentArticles, setRecentArticles] = useState<MiniArticle[]>([]);
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const auth = getFirebaseAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const [statsRes, articlesRes] = await Promise.all([
          fetch("/api/stats", { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch("/api/articles", { headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : {};
        const articlesData = articlesRes.ok ? await articlesRes.json() : { articles: [] };
        const articles = articlesData.articles || [];

        setAllArticles(articles);

        const mapped = articles.slice(0, 5).map((a: any) => ({
          id: a.id,
          keyword: a.keyword,
          status: a.status,
          updatedAt: new Date(a.updatedAt?._seconds * 1000 || Date.now()),
        }));
        setRecentArticles(mapped);

        const statusCounts = {
          brief: articles.filter((a: any) => a.status === 'brief').length,
          outline: articles.filter((a: any) => a.status === 'outline').length,
          draft: articles.filter((a: any) => a.status === 'draft').length,
          optimized: articles.filter((a: any) => a.status === 'optimized').length,
        };

        // Handle both direct numbers and Firestore count objects
        const extractCount = (val: any) => {
          if (typeof val === 'number') return val;
          if (val && typeof val === 'object' && 'count' in val) return val.count;
          return 0;
        };

        setStats({
          totalArticles: extractCount(statsData.totalArticles),
          totalSites: extractCount(statsData.totalSites),
          articlesThisMonth: extractCount(statsData.articlesThisMonth),
          lastActivity: statsData.lastActivity ? new Date(statsData.lastActivity._seconds * 1000) : null,
          planTier: statsData.planTier || "free",
          articlesByStatus: statusCounts,
        });
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
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

  // Calculate days until plan resets
  const daysUntilReset = (() => {
    if (!periodEnd) return null;

    // Handle both Firestore timestamp and ISO string
    let endDate: Date;
    if (typeof periodEnd === 'object' && '_seconds' in periodEnd) {
      endDate = new Date((periodEnd as any)._seconds * 1000);
    } else if (typeof periodEnd === 'string') {
      endDate = new Date(periodEnd);
    } else if (periodEnd instanceof Date) {
      endDate = periodEnd;
    } else {
      return null;
    }

    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  })();

  // Calculate monthly trend (last 6 months)
  const monthlyTrend = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthArticles = allArticles.filter((a: any) => {
        const createdAt = new Date(a.createdAt?._seconds * 1000 || 0);
        return createdAt.getMonth() === date.getMonth() &&
          createdAt.getFullYear() === date.getFullYear();
      });

      trend.push({
        month: months[date.getMonth()],
        count: monthArticles.length,
      });
    }

    return trend;
  })();

  if (loading) {
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

  // Safe stat helper to avoid "Objects are not valid as React child" 
  const renderStat = (val: any) => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object') {
      if ('value' in val) return val.value;
      if ('count' in val) return val.count;
    }
    return 0;
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto aurora-bg noise-overlay overflow-hidden">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 relative z-10">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight font-display">
            Welcome back, <span className="gradient-gold-teal">Writer</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm lg:text-base text-muted-foreground">
            You've generated {articlesUsed} articles this month. Ready for more?
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => router.push("/dashboard/research")}
            className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground active:scale-95 touch-manipulation"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Research</span>
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
            className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gold/30 bg-gold px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-obsidian transition-all hover:bg-gold/90 active:scale-95 touch-manipulation"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">New Article</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {/* Usage Ring Card */}
        <div className="sm:col-span-2 flex items-center gap-3 sm:gap-4 lg:gap-6 rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-6 card-premium">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 shrink-0 items-center justify-center">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                className="stroke-muted"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={usagePct > 80 ? 'stroke-gold' : 'stroke-teal'}
                style={{ transition: 'all 1s ease-out' }}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - usagePct / 100)}
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{Math.round(usagePct)}%</span>
              <span className="font-mono-dm text-[8px] sm:text-[9px] lg:text-[10px] uppercase tracking-wider text-muted-foreground">used</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold" />
              <h3 className="font-mono-dm text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground">Monthly Quota</h3>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              {renderStat(articlesUsed)} <span className="text-muted-foreground font-medium">/ {totalLimit}</span>
            </p>
            <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
              {daysUntilReset !== null ? (
                <>
                  Your {currentPlan} plan resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}.
                  {currentPlan !== "pro" && (
                    <button
                      onClick={() => router.push("/dashboard/settings")}
                      className="ml-1 underline underline-offset-2 transition-colors text-gold hover:text-gold-dim active:scale-95 touch-manipulation"
                    >
                      Upgrade?
                    </button>
                  )}
                </>
              ) : (
                <>
                  Your {currentPlan} plan.
                  {currentPlan !== "pro" && (
                    <button
                      onClick={() => router.push("/dashboard/settings")}
                      className="ml-1 underline underline-offset-2 transition-colors text-gold hover:text-gold-dim active:scale-95 touch-manipulation"
                    >
                      Upgrade?
                    </button>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Total Articles */}
        <div className="rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-6 card-premium flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-1.5 sm:p-2 bg-teal/10 text-teal">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 text-teal" />
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-mono-dm text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Lifetime Articles</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{renderStat(stats.totalArticles)}</p>
          </div>
        </div>

        {/* Total Sites */}
        <div className="rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-6 card-premium flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-1.5 sm:p-2 bg-lilac/10 text-lilac">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 text-gold" />
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-mono-dm text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">Connected Sites</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{renderStat(stats.totalSites)}</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        data={{
          totalArticles: stats.totalArticles,
          articlesThisMonth: stats.articlesThisMonth,
          articlesByStatus: stats.articlesByStatus,
          monthlyTrend,
        }}
      />

      {/* Pro SaaS Row: Needs Repurposing & Roadmap */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 relative z-10">
        {/* Needs Repurposing Widget */}
        <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium bg-gold/5 border-gold/20 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-[#0a0700]">
                <Share2 className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Needs Repurposing</h3>
            </div>
            <span className="badge-gold text-[10px]">Action Required</span>
          </div>

          <div className="flex-1 space-y-3">
            {allArticles.filter(a => (a.status === 'optimized' || a.status === 'draft_generated') && !a.socialAssets).slice(0, 2).map((art, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border group hover:border-gold/30 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/articles/${art.id}`)}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{art.keyword}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Published • No social assets found</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
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
        <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium bg-lilac/5 border-lilac/20 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lilac text-white">
                <ListTodo className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">Content Roadmap</h3>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-lilac animate-pulse" />
              <div>
                <p className="text-xs font-bold text-foreground">Next Cluster Article</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Based on your strategy, your next pillar support is missing.</p>
                <button
                  onClick={() => router.push("/dashboard/research?mode=clusters")}
                  className="mt-2 text-[10px] font-bold text-lilac hover:underline"
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
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3 relative z-10 w-full">
        {/* Pipeline / Recent Activity */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0">
          <div className="flex items-center justify-between px-1 sm:px-2">
            <h2 className="font-display text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 text-foreground">
              <Layout className="h-4 w-4 sm:h-5 sm:w-5 text-gold shrink-0" />
              <span>Recent Articles</span>
            </h2>
            <button
              onClick={() => router.push("/dashboard/articles")}
              className="font-mono-dm text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-gold active:scale-95 touch-manipulation shrink-0"
            >
              View All
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3 w-full">
            {recentArticles.length === 0 ? (
              <div className="rounded-xl sm:rounded-2xl border border-dashed p-6 sm:p-8 lg:p-12 text-center bg-card border-border w-full">
                <Sparkles className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                <p className="text-xs sm:text-sm text-muted-foreground">No articles in the pipeline yet.</p>
                <button
                  onClick={() => router.push("/dashboard/articles/new")}
                  className="font-mono-dm mt-3 sm:mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:underline text-gold active:scale-95 touch-manipulation"
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
                        <span className="truncate">{article.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`font-mono-dm rounded-md sm:rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${article.status === "optimized"
                          ? 'bg-teal/10 text-teal border-teal/20'
                          : 'bg-gold/10 text-gold border-gold/20'
                        }`}
                    >
                      {article.status.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateArticle(article.id);
                      }}
                      className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-muted-foreground hover:text-gold active:scale-95 touch-manipulation"
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
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Usage Meter */}
          {!usageLoading && usageData && (
            <UsageMeter
              plan={usageData.plan}
              articlesUsed={usageData.usage.articlesUsed}
              aiImprovementsUsed={usageData.usage.aiImprovementsUsed}
              sectionRegenerationsUsed={usageData.usage.sectionRegenerationsUsed}
              rolloverArticles={usageData.usage.rolloverArticles}
              onUpgrade={() => router.push("/dashboard/settings?tab=billing")}
            />
          )}

          <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-6 card-premium overflow-hidden relative w-full">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-20 w-20 sm:h-24 sm:w-24 rounded-full blur-2xl bg-gold/10" />
            <h3 className="font-display text-base sm:text-lg font-bold flex items-center gap-2 mb-3 sm:mb-4 text-foreground relative z-10">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold shrink-0" />
              <span>Pro Tips</span>
            </h3>
            <ul className="space-y-3 sm:space-y-4 relative z-10">
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-gold" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Use the <strong className="text-foreground">Research Tool</strong> to find low-competition keywords before generating.
                </p>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-teal" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Export directly to <strong className="text-foreground">WordPress</strong> to save 20 mins per post on formatting.
                </p>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-lilac" />
                <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground">
                  Connect multiple sites to manage all your niche properties from one premium command center.
                </p>
              </li>
            </ul>
          </div>

          <button
            onClick={() => router.push("/dashboard/research")}
            className="group block w-full rounded-xl sm:rounded-2xl border p-4 sm:p-6 text-left transition-all border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 active:scale-[0.98] touch-manipulation"
          >
            <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl shadow-gold bg-gold text-[#0a0700]">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">New Research Study</h4>
            <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Discover untapped niche topics and cluster ideas.</p>
          </button>

          {/* Upgrade CTA for Free Users */}
          {usageData?.plan === 'free' && (
            <UpgradeCTA 
              variant="card"
              reason="You're on the free plan. Upgrade to create 5x more content!"
            />
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />
    </div>
  );
}

