/**
 * Plan tiers and limits
 */

export const PLAN_TIERS = {
  free: {
    name: 'Free',
    articlesPerMonth: 5,
    aiOptimizationsPerMonth: 3,
    maxSeoScore: 70,
    features: {
      basicSeoScoring: true,
      aiOptimization: true,
      competitorAnalysis: false,
      bulkOperations: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    price: 0,
  },
  starter: {
    name: 'Starter',
    articlesPerMonth: 15,
    aiOptimizationsPerMonth: 15,
    maxSeoScore: 85,
    features: {
      basicSeoScoring: true,
      aiOptimization: true,
      competitorAnalysis: false,
      bulkOperations: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    price: 29,
  },
  pro: {
    name: 'Pro',
    articlesPerMonth: 60,
    aiOptimizationsPerMonth: -1, // unlimited
    maxSeoScore: 100,
    features: {
      basicSeoScoring: true,
      aiOptimization: true,
      competitorAnalysis: true,
      bulkOperations: true,
      prioritySupport: true,
      whiteLabel: false,
    },
    price: 99,
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

export function getPlanLimits(tier: PlanTier) {
  return PLAN_TIERS[tier];
}

export function canUseFeature(tier: PlanTier, feature: keyof typeof PLAN_TIERS.free.features): boolean {
  return PLAN_TIERS[tier].features[feature];
}

export function hasOptimizationsRemaining(
  tier: PlanTier,
  usedOptimizations: number
): boolean {
  const limit = PLAN_TIERS[tier].aiOptimizationsPerMonth;
  if (limit === -1) return true; // unlimited
  return usedOptimizations < limit;
}

export function hasArticlesRemaining(
  tier: PlanTier,
  usedArticles: number
): boolean {
  const limit = PLAN_TIERS[tier].articlesPerMonth;
  return usedArticles < limit;
}

export function getOptimizationsRemaining(
  tier: PlanTier,
  usedOptimizations: number
): number | 'unlimited' {
  const limit = PLAN_TIERS[tier].aiOptimizationsPerMonth;
  if (limit === -1) return 'unlimited';
  return Math.max(0, limit - usedOptimizations);
}

export function getArticlesRemaining(
  tier: PlanTier,
  usedArticles: number
): number {
  const limit = PLAN_TIERS[tier].articlesPerMonth;
  return Math.max(0, limit - usedArticles);
}
