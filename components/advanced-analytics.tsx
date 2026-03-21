"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { 
  BarChart3, Download, TrendingUp, Zap, FileText, RefreshCw, 
  Clock, Target, DollarSign, Activity, Award, Sparkles, TrendingDown 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AnalyticsData {
  plan: string;
  usage: any;
  usagePercentages: any;
  stats: any;
  roi?: any;
  performance?: any;
  insights?: any;
}

function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const started = useRef(false);

  useEffect(() => {
    if (isInView && !started.current) {
      started.current = true;
      const steps = 60;
      const inc = end / steps;
      let cur = 0;
      const id = setInterval(() => {
        cur += inc;
        if (cur >= end) { setCount(end); clearInterval(id); }
        else setCount(Math.floor(cur));
      }, duration / steps);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function CircularProgress({ value, size = 120, strokeWidth = 8, color = "#6366f1" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const ref = useRef<SVGCircleElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/20"
      />
      <motion.circle
        ref={ref}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={isInView ? { strokeDashoffset: offset } : {}}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:border-primary/30 transition-all duration-300 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "insights">("overview");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportCSV = () => {
    if (!data) return;

    const csv = [
      ['Metric', 'Used', 'Limit', 'Percentage'],
      ['Articles', data.usage.articlesUsed, data.usage.articlesLimit, `${data.usagePercentages.articles}%`],
      ['AI Improvements', data.usage.aiImprovementsUsed, data.usage.aiImprovementsLimit === 999999 ? 'Unlimited' : data.usage.aiImprovementsLimit, `${data.usagePercentages.aiImprovements}%`],
      ['Section Regenerations', data.usage.sectionRegenerationsUsed, data.usage.sectionRegenerationsLimit === 999999 ? 'Unlimited' : data.usage.sectionRegenerationsLimit, `${data.usagePercentages.sectionRegenerations}%`],
      ['Research Queries', data.usage.researchQueriesUsed, data.usage.researchQueriesLimit === 999999 ? 'Unlimited' : data.usage.researchQueriesLimit, `${data.usagePercentages.researchQueries}%`],
      ['Social Generations', data.usage.socialGenerationUsed, data.usage.socialGenerationLimit === 999999 ? 'Unlimited' : data.usage.socialGenerationLimit, `${data.usagePercentages.socialGenerations}%`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pubwize-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Analytics exported");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="h-48 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "performance", label: "Performance", icon: Activity },
    { id: "insights", label: "Insights", icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(data.stats.periodStart), 'MMM d')} - {format(new Date(data.stats.periodEnd), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-accent text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Articles", value: data.stats.totalArticles, icon: FileText, color: "from-blue-500 to-cyan-500", suffix: "" },
                { label: "Cost/Article", value: typeof data.roi.costPerArticle === 'string' ? data.roi.costPerArticle : `$${data.roi.costPerArticle}`, icon: DollarSign, color: "from-emerald-500 to-teal-500", suffix: "", raw: data.roi.costPerArticle },
                { label: "Time Saved", value: data.roi.timeSavedHours, icon: Clock, color: "from-violet-500 to-purple-500", suffix: "h" },
                { label: "Avg Words", value: data.insights.avgWordCount, icon: Target, color: "from-orange-500 to-amber-500", suffix: "" },
              ].map((metric, i) => (
                <GlassCard key={metric.label} delay={i * 0.1} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                      <metric.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold">
                    {typeof metric.value === 'number' ? (
                      <>
                        <AnimatedCounter end={metric.value} suffix={metric.suffix} />
                      </>
                    ) : (
                      <span className={metric.raw === 'Free' ? 'text-emerald-500' : ''}>{metric.value}</span>
                    )}
                  </p>
                </GlassCard>
              ))}
            </div>

            {/* ROI Section */}
            <GlassCard delay={0.2} className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Return on Investment</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Value Generated</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    $<AnimatedCounter end={data.roi.valueGenerated} />
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                  <p className="text-2xl font-bold text-violet-500">
                    <AnimatedCounter end={data.roi.timeSavedHours} suffix="h" />
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                  <p className="text-sm text-muted-foreground mb-1">ROI Multiple</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {data.roi.breakEven > 0 ? `${data.roi.breakEven}x` : 'N/A'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Usage Breakdown */}
            <GlassCard delay={0.3} className="p-6">
              <h3 className="text-xl font-bold mb-6">Feature Usage</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Articles Generated', used: data.usage.articlesUsed, limit: data.usage.articlesLimit, icon: FileText, color: 'bg-blue-500' },
                  { label: 'AI Improvements', used: data.usage.aiImprovementsUsed, limit: data.usage.aiImprovementsLimit, icon: Zap, color: 'bg-amber-500' },
                  { label: 'Section Regenerations', used: data.usage.sectionRegenerationsUsed, limit: data.usage.sectionRegenerationsLimit, icon: RefreshCw, color: 'bg-violet-500' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isUnlimited = item.limit === 999999;
                  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100));
                  
                  return (
                    <div key={item.label} className="p-5 rounded-xl border border-border bg-card/30 hover:bg-card/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">{item.label}</span>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold"><AnimatedCounter end={item.used} /></span>
                        <span className="text-sm text-muted-foreground">/ {isUnlimited ? '∞' : item.limit}</span>
                      </div>
                      {!isUnlimited && (
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full ${item.color}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Performance Metrics</h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <CircularProgress value={66} size={140} strokeWidth={10} color="#8b5cf6" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold">
                        {data.performance.avgCompletionMinutes >= 60 
                          ? `${Math.round(data.performance.avgCompletionMinutes / 60)}`
                          : data.performance.avgCompletionMinutes
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.performance.avgCompletionMinutes >= 60 ? 'hours' : 'mins'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                </div>
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <CircularProgress value={90} size={140} strokeWidth={10} color="#10b981" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-emerald-500">
                        {data.performance.fastestMinutes >= 60 
                          ? `${Math.round(data.performance.fastestMinutes / 60)}`
                          : data.performance.fastestMinutes
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.performance.fastestMinutes >= 60 ? 'hours' : 'mins'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Fastest</p>
                </div>
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <CircularProgress value={30} size={140} strokeWidth={10} color="#ef4444" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-red-500">
                        {data.performance.slowestMinutes >= 1440 
                          ? `${Math.round(data.performance.slowestMinutes / 1440)}`
                          : data.performance.slowestMinutes >= 60
                          ? `${Math.round(data.performance.slowestMinutes / 60)}`
                          : data.performance.slowestMinutes
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.performance.slowestMinutes >= 1440 
                          ? 'days'
                          : data.performance.slowestMinutes >= 60
                          ? 'hours'
                          : 'mins'
                        }
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Slowest</p>
                </div>
              </div>
            </GlassCard>

            {/* Article Status */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-6">Article Status Distribution</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data.stats.statusBreakdown).map(([status, count], i) => (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border text-center hover:border-primary/30 transition-colors"
                  >
                    <div className="text-4xl font-bold mb-2">
                      <AnimatedCounter end={count as number} />
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">{status}</div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "insights" && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Top Keywords</h3>
              </div>
              <div className="space-y-3">
                {data.insights.topKeywords.length > 0 ? (
                  data.insights.topKeywords.map((kw: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-card to-card/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          #{i + 1}
                        </div>
                        <span className="font-medium">{kw.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {kw.count}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No keywords tracked yet</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
