"use client";

import { BarChart3, TrendingUp, FileText, CheckCircle2, Clock, Zap } from "lucide-react";

interface AnalyticsData {
  totalArticles: number;
  articlesThisMonth: number;
  articlesByStatus: {
    brief: number;
    outline: number;
    draft: number;
    optimized: number;
  };
  monthlyTrend: Array<{ month: string; count: number }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const maxCount = Math.max(...data.monthlyTrend.map(m => m.count), 1);

  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2 relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 w-full">
      {/* Status Distribution */}
      <div className="rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-6 card-premium min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gold shrink-0" />
          <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-foreground truncate">
            Content Pipeline
          </h3>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {[
            { label: 'Brief', count: data.articlesByStatus.brief, colorClass: 'text-gold', bgClass: 'bg-gold', icon: FileText },
            { label: 'Outline', count: data.articlesByStatus.outline, colorClass: 'text-lilac', bgClass: 'bg-lilac', icon: TrendingUp },
            { label: 'Draft', count: data.articlesByStatus.draft, colorClass: 'text-teal', bgClass: 'bg-teal', icon: FileText },
            { label: 'Optimized', count: data.articlesByStatus.optimized, colorClass: 'text-teal', bgClass: 'bg-teal', icon: CheckCircle2 },
          ].map((status) => {
            const percentage = data.totalArticles > 0 ? (status.count / data.totalArticles) * 100 : 0;
            return (
              <div key={status.label} className="min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <status.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${status.colorClass} shrink-0`} />
                    <span className="font-mono-dm text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground truncate">
                      {status.label}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground shrink-0">
                    {status.count}
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${status.bgClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-6 card-premium min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-teal shrink-0" />
          <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-foreground truncate">
            Monthly Activity
          </h3>
        </div>

        <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-40">
          {data.monthlyTrend.map((month, i) => {
            const height = (month.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-full flex items-end justify-center h-24 sm:h-[120px]">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group gradient-gold-teal-bg"
                    style={{
                      height: `${height}%`,
                      minHeight: month.count > 0 ? '8px' : '0'
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-card text-foreground border whitespace-nowrap">
                        {month.count}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="font-mono-dm text-[8px] sm:text-[10px] uppercase text-muted-foreground truncate w-full text-center">
                  {month.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="lg:col-span-2 grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 w-full">
        {[
          { label: 'Avg/Month', fullLabel: 'Avg per Month', value: Math.round(data.totalArticles / Math.max(data.monthlyTrend.length, 1)), icon: Clock, colorClass: 'text-lilac', bgClass: 'bg-lilac/10' },
          { label: 'This Month', fullLabel: 'This Month', value: data.articlesThisMonth, icon: Zap, colorClass: 'text-gold', bgClass: 'bg-gold/10' },
          { label: 'Complete', fullLabel: 'Completion Rate', value: `${data.totalArticles > 0 ? Math.round((data.articlesByStatus.optimized / data.totalArticles) * 100) : 0}%`, icon: CheckCircle2, colorClass: 'text-teal', bgClass: 'bg-teal/10' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg sm:rounded-xl border p-2.5 sm:p-3 lg:p-4 card-premium min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 mb-1.5 sm:mb-2">
              <stat.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 ${stat.colorClass} shrink-0`} />
              <span className="font-mono-dm text-[8px] sm:text-[9px] lg:text-xs uppercase tracking-wider text-muted-foreground truncate">
                <span className="sm:hidden">{stat.label}</span>
                <span className="hidden sm:inline">{stat.fullLabel}</span>
              </span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
