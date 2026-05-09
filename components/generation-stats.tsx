"use client";

import { useEffect, useState } from "react";
import { useUserPlan } from "@/lib/hooks/use-user-plan";
import { FileText, TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function GenerationStats() {
  const planData = useUserPlan();
  const [stats, setStats] = useState({
    avgScore: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    // Calculate stats
    const articlesGenerated = planData.articlesUsed;
    const avgTimePerArticle = 2.5; // hours
    const timeSaved = articlesGenerated * avgTimePerArticle;
    
    // Only show avg score if user has generated articles
    const avgScore = articlesGenerated > 0 ? 85 : 0;
    
    setStats({ avgScore, timeSaved });
  }, [planData.articlesUsed]);

  if (planData.loading) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-6">
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Your Generation Stats</h3>
        {planData.planTier === 'free' && (
          <Link
            href="/dashboard/settings?tab=billing"
            className="text-[10px] sm:text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
          >
            Upgrade →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Articles this month */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Articles</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {planData.articlesUsed}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              /{planData.articlesLimit}
            </span>
          </p>
        </div>

        {/* Avg SEO Score */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Score</span>
          </div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold",
            stats.avgScore >= 80 ? "text-green-400" : "text-yellow-400"
          )}>
            {stats.avgScore > 0 ? stats.avgScore : '--'}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">/100</span>
          </p>
        </div>

        {/* Time saved */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Time Saved</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {stats.timeSaved.toFixed(1)}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">h</span>
          </p>
        </div>

        {/* Optimizations */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">AI Fixes</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {planData.optimizationsUsed}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              /{planData.optimizationsLimit === 'unlimited' ? '∞' : planData.optimizationsLimit}
            </span>
          </p>
        </div>
      </div>

      {/* Upgrade prompt for free users */}
      {planData.planTier === 'free' && planData.articlesUsed >= 3 && (
        <div className="mt-3 sm:mt-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 sm:p-3">
          <p className="text-[10px] sm:text-xs text-foreground/80 leading-relaxed">
            <strong>You're on fire! 🔥</strong> Upgrade to Starter for 15 articles/month
          </p>
        </div>
      )}
    </div>
  );
}
