"use client";

import { AlertCircle, TrendingUp, Share2, Sparkles, Zap } from "lucide-react";
import { PLANS, getUsagePercentage, getRemainingUsage, type PlanTier } from "@/lib/pricing";

interface UsageMeterProps {
  plan: PlanTier;
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  rolloverArticles?: number;
  socialGenerationsUsed?: number;
  onUpgrade?: () => void;
}

export function UsageMeter({
  plan,
  articlesUsed,
  aiImprovementsUsed,
  sectionRegenerationsUsed,
  rolloverArticles = 0,
  socialGenerationsUsed = 0,
  onUpgrade,
}: UsageMeterProps) {
  const limits = PLANS[plan].limits;
  
  const articlePercentage = getUsagePercentage(articlesUsed, limits.articlesPerMonth, rolloverArticles);
  const articlesRemaining = getRemainingUsage(articlesUsed, limits.articlesPerMonth, rolloverArticles);
  
  const improvementPercentage = getUsagePercentage(aiImprovementsUsed, limits.aiImprovementsPerMonth);
  const improvementsRemaining = getRemainingUsage(aiImprovementsUsed, limits.aiImprovementsPerMonth);
  
  const regenPercentage = getUsagePercentage(sectionRegenerationsUsed, limits.sectionRegenerationsPerMonth);
  const regensRemaining = getRemainingUsage(sectionRegenerationsUsed, limits.sectionRegenerationsPerMonth);

  // Social repurpose limit (unlimited for pro, 10 for starter, 3 for free)
  const socialLimit = plan === 'pro' ? 999 : plan === 'starter' ? 10 : 3;
  const socialPercentage = getUsagePercentage(socialGenerationsUsed, socialLimit);
  const socialRemaining = getRemainingUsage(socialGenerationsUsed, socialLimit);

  const shouldShowWarning = articlePercentage >= 80 || improvementPercentage >= 80 || regenPercentage >= 80 || socialPercentage >= 80;

  return (
    <div className="rounded-xl sm:rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-4 sm:p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-teal/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-gold" />
            </div>
            <h3 className="text-base sm:text-lg font-black font-display text-foreground">Usage This Month</h3>
          </div>
          {shouldShowWarning && (
            <div className="flex items-center gap-1.5 text-gold text-xs font-bold">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Running low</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Articles */}
          <div className="group/item">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-teal" />
                <span className="text-sm font-bold text-foreground">Articles</span>
              </div>
              <span className="text-sm font-black text-foreground">
                {articlesUsed} / {limits.articlesPerMonth + rolloverArticles}
                {rolloverArticles > 0 && (
                  <span className="text-xs text-teal ml-1">(+{rolloverArticles})</span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  articlePercentage >= 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : articlePercentage >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-teal to-cyan-500'
                }`}
                style={{ width: `${articlePercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {articlesRemaining} remaining
            </p>
          </div>

          {/* Social Repurpose */}
          <div className="group/item">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5 text-lilac" />
                <span className="text-sm font-bold text-foreground">Social Repurpose</span>
              </div>
              <span className="text-sm font-black text-foreground">
                {socialGenerationsUsed} / {plan === 'pro' ? '∞' : socialLimit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  socialPercentage >= 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : socialPercentage >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-lilac to-purple-500'
                }`}
                style={{ width: `${plan === 'pro' ? 0 : socialPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {plan === 'pro' ? 'Unlimited' : `${socialRemaining} remaining`}
            </p>
          </div>

          {/* AI Improvements */}
          <div className="group/item">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-sm font-bold text-foreground">AI Improvements</span>
              </div>
              <span className="text-sm font-black text-foreground">
                {aiImprovementsUsed} / {limits.aiImprovementsPerMonth}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  improvementPercentage >= 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : improvementPercentage >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-gold to-amber-500'
                }`}
                style={{ width: `${improvementPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {improvementsRemaining} remaining
            </p>
          </div>

          {/* Section Regenerations */}
          <div className="group/item">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm font-bold text-foreground">Regenerations</span>
              </div>
              <span className="text-sm font-black text-foreground">
                {sectionRegenerationsUsed} / {limits.sectionRegenerationsPerMonth}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  regenPercentage >= 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : regenPercentage >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                }`}
                style={{ width: `${regenPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {regensRemaining} remaining
            </p>
          </div>
        </div>

        {/* Upgrade CTA */}
        {shouldShowWarning && plan !== 'pro' && onUpgrade && (
          <div className="mt-6 p-4 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-amber-500/10">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground mb-1">
                  Running low on credits?
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Upgrade to {plan === 'free' ? 'Starter' : 'Pro'} for {plan === 'free' ? '5x' : '4x'} more articles and unlimited social repurpose.
                </p>
                <button
                  onClick={onUpgrade}
                  className="text-xs font-bold text-gold hover:underline"
                >
                  View Plans →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
