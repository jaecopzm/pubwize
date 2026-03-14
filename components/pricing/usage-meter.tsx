"use client";

import { AlertCircle, TrendingUp } from "lucide-react";
import { PLANS, getUsagePercentage, getRemainingUsage, type PlanTier } from "@/lib/pricing";

interface UsageMeterProps {
  plan: PlanTier;
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  rolloverArticles?: number;
  onUpgrade?: () => void;
}

export function UsageMeter({
  plan,
  articlesUsed,
  aiImprovementsUsed,
  sectionRegenerationsUsed,
  rolloverArticles = 0,
  onUpgrade,
}: UsageMeterProps) {
  const limits = PLANS[plan].limits;
  
  const articlePercentage = getUsagePercentage(articlesUsed, limits.articlesPerMonth, rolloverArticles);
  const articlesRemaining = getRemainingUsage(articlesUsed, limits.articlesPerMonth, rolloverArticles);
  
  const improvementPercentage = getUsagePercentage(aiImprovementsUsed, limits.aiImprovementsPerMonth);
  const improvementsRemaining = getRemainingUsage(aiImprovementsUsed, limits.aiImprovementsPerMonth);
  
  const regenPercentage = getUsagePercentage(sectionRegenerationsUsed, limits.sectionRegenerationsPerMonth);
  const regensRemaining = getRemainingUsage(sectionRegenerationsUsed, limits.sectionRegenerationsPerMonth);

  const shouldShowWarning = articlePercentage >= 80 || improvementPercentage >= 80 || regenPercentage >= 80;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold font-display">Usage This Month</h3>
        {shouldShowWarning && (
          <div className="flex items-center gap-1.5 text-gold text-xs font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Running low</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Articles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-2">Articles</span>
            <span className="text-sm font-bold">
              {articlesUsed} / {limits.articlesPerMonth + rolloverArticles}
              {rolloverArticles > 0 && (
                <span className="text-xs text-teal ml-1">(+{rolloverArticles} rollover)</span>
              )}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                articlePercentage >= 90
                  ? 'bg-red-500'
                  : articlePercentage >= 80
                  ? 'bg-gold'
                  : 'bg-teal'
              }`}
              style={{ width: `${articlePercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-3 mt-1">
            {articlesRemaining} articles remaining
          </p>
        </div>

        {/* AI Improvements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-2">AI Improvements</span>
            <span className="text-sm font-bold">
              {aiImprovementsUsed} / {limits.aiImprovementsPerMonth}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                improvementPercentage >= 90
                  ? 'bg-red-500'
                  : improvementPercentage >= 80
                  ? 'bg-gold'
                  : 'bg-lilac'
              }`}
              style={{ width: `${improvementPercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-3 mt-1">
            {improvementsRemaining} improvements remaining
          </p>
        </div>

        {/* Section Regenerations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-2">Section Regenerations</span>
            <span className="text-sm font-bold">
              {sectionRegenerationsUsed} / {limits.sectionRegenerationsPerMonth}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                regenPercentage >= 90
                  ? 'bg-red-500'
                  : regenPercentage >= 80
                  ? 'bg-gold'
                  : 'bg-gold'
              }`}
              style={{ width: `${regenPercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-3 mt-1">
            {regensRemaining} regenerations remaining
          </p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {shouldShowWarning && plan !== 'pro' && onUpgrade && (
        <div className="mt-6 p-4 rounded-lg border border-gold/30 bg-gold/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-1 mb-1">
                Running low on {plan === 'free' ? 'articles' : 'credits'}?
              </p>
              <p className="text-xs text-text-3 mb-3">
                Upgrade to {plan === 'free' ? 'Starter' : 'Pro'} for {plan === 'free' ? '5x' : '4x'} more articles and features.
              </p>
              <button
                onClick={onUpgrade}
                className="text-xs font-semibold text-gold hover:underline"
              >
                View Plans →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
