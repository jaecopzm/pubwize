"use client";

import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { BarChart3, Download, TrendingUp, Zap, FileText, RefreshCw, Clock, Target, DollarSign } from "lucide-react";
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

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 sm:p-6 rounded-xl border border-border bg-card/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
            <h2 className="text-lg sm:text-xl font-bold">Analytics Dashboard</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Period: {format(new Date(data.stats.periodStart), 'MMM d')} - {format(new Date(data.stats.periodEnd), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-xs sm:text-sm transition-colors flex-1 sm:flex-initial"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-initial"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card-premium p-3 sm:p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-teal/15 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Total Articles</p>
              <p className="text-xl sm:text-2xl font-bold">{data.stats.totalArticles}</p>
            </div>
          </div>
        </div>

        <div className="card-premium p-3 sm:p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Cost/Article</p>
              <p className="text-xl sm:text-2xl font-bold">
                {typeof data.roi.costPerArticle === 'string' && data.roi.costPerArticle === 'Free' 
                  ? <span className="text-teal">Free</span>
                  : `$${data.roi.costPerArticle}`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-3 sm:p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-lilac/15 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-lilac" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Time Saved</p>
              <p className="text-xl sm:text-2xl font-bold">{data.roi.timeSavedHours}h</p>
            </div>
          </div>
        </div>

        <div className="card-premium p-3 sm:p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-teal/15 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">Avg Words</p>
              <p className="text-xl sm:text-2xl font-bold">{data.insights.avgWordCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROI & Performance */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="card-premium p-4 sm:p-6 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
            <h3 className="text-base sm:text-lg font-bold">Return on Investment</h3>
          </div>
          <div className="space-y-2 sm:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-card/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Value Generated</span>
              <span className="text-base sm:text-xl font-bold text-teal">${data.roi.valueGenerated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-card/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Time Saved</span>
              <span className="text-base sm:text-xl font-bold text-lilac">{data.roi.timeSavedHours}h</span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-card/50">
              <span className="text-xs sm:text-sm text-muted-foreground">ROI Multiple</span>
              <span className="text-base sm:text-xl font-bold text-gold">
                {data.roi.breakEven > 0 ? `${data.roi.breakEven}x` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="card-premium p-4 sm:p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-lilac" />
            <h3 className="text-base sm:text-lg font-bold">Performance Metrics</h3>
          </div>
          <div className="space-y-2 sm:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
              <span className="text-xs sm:text-sm text-muted-foreground">Avg Completion</span>
              <span className="text-base sm:text-xl font-bold">
                {data.performance.avgCompletionMinutes >= 60 
                  ? `${Math.round(data.performance.avgCompletionMinutes / 60)}h`
                  : `${data.performance.avgCompletionMinutes}m`
                }
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
              <span className="text-xs sm:text-sm text-muted-foreground">Fastest Article</span>
              <span className="text-base sm:text-xl font-bold text-teal">
                {data.performance.fastestMinutes >= 60 
                  ? `${Math.round(data.performance.fastestMinutes / 60)}h`
                  : `${data.performance.fastestMinutes}m`
                }
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
              <span className="text-xs sm:text-sm text-muted-foreground">Slowest Article</span>
              <span className="text-base sm:text-xl font-bold text-muted-foreground">
                {data.performance.slowestMinutes >= 1440 
                  ? `${Math.round(data.performance.slowestMinutes / 1440)}d`
                  : data.performance.slowestMinutes >= 60
                  ? `${Math.round(data.performance.slowestMinutes / 60)}h`
                  : `${data.performance.slowestMinutes}m`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="card-premium p-4 sm:p-6 rounded-xl border border-border bg-card">
        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Feature Usage This Period</h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Articles Generated', used: data.usage.articlesUsed, limit: data.usage.articlesLimit, icon: FileText, color: 'teal' },
            { label: 'AI Improvements', used: data.usage.aiImprovementsUsed, limit: data.usage.aiImprovementsLimit, icon: Zap, color: 'gold' },
            { label: 'Section Regenerations', used: data.usage.sectionRegenerationsUsed, limit: data.usage.sectionRegenerationsLimit, icon: RefreshCw, color: 'lilac' },
          ].map((item) => {
            const Icon = item.icon;
            const isUnlimited = item.limit === 999999;
            const percentage = isUnlimited ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100));
            
            return (
              <div key={item.label} className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-${item.color}`} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl sm:text-2xl font-bold">{item.used}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">/ {isUnlimited ? '∞' : item.limit}</span>
                </div>
                {!isUnlimited && (
                  <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full bg-${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Article Status & Top Keywords */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="card-premium p-4 sm:p-6 rounded-xl border border-border bg-card">
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Article Status</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Object.entries(data.stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="p-3 sm:p-4 rounded-lg bg-muted/30 text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-1">{count as number}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-4 sm:p-6 rounded-xl border border-border bg-card">
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Top Keywords</h3>
          <div className="space-y-2 sm:space-y-3">
            {data.insights.topKeywords.length > 0 ? (
              data.insights.topKeywords.map((kw: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30">
                  <span className="text-xs sm:text-sm font-medium truncate flex-1">{kw.keyword}</span>
                  <span className="badge-gold text-[10px] sm:text-xs ml-2">{kw.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">No keywords tracked yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
