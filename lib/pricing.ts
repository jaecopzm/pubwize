/**
 * Pricing plans and usage limits
 */

export type PlanTier = 'free' | 'starter' | 'pro';

export interface PlanLimits {
  articlesPerMonth: number;
  aiImprovementsPerMonth: number;
  sectionRegenerationsPerMonth: number;
  researchQueriesPerMonth: number;
  socialGenerationsPerMonth: number;
  siteConnections: number;
  templates: 'basic' | 'all' | 'unlimited';
  bulkGeneration: number; // 0 = disabled, N = max articles at once
  versionHistoryDays: number;
  support: 'community' | 'email' | 'priority';
  hasWatermark: boolean;
  rolloverLimit: number; // max articles that can rollover
}

export interface PlanDetails {
  id: PlanTier;
  name: string;
  price: number; // monthly price in dollars
  annualPrice: number; // annual price in dollars
  description: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanTier, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    description: 'Perfect for testing and hobbyists',
    features: [
      '5 articles per month',
      'AI Brief → Outline → Draft → SEO → Social',
      '5 social media generations/month',
      '10 AI improvements & 5 section regenerations',
      '10 keyword research queries',
      '1 site connection with brand voice',
      'WordPress publishing',
      'Social media repurposing (4 platforms)',
      'Content calendar & scheduling',
      'Export (Markdown, HTML, JSON)',
      'Community support',
    ],
    limits: {
      articlesPerMonth: 5,
      aiImprovementsPerMonth: 10,
      sectionRegenerationsPerMonth: 5,
      researchQueriesPerMonth: 10,
      socialGenerationsPerMonth: 5,
      siteConnections: 1,
      templates: 'basic',
      bulkGeneration: 0,
      versionHistoryDays: 7,
      support: 'community',
      hasWatermark: true,
      rolloverLimit: 0,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    annualPrice: 190,
    description: 'Great for serious bloggers',
    features: [
      '25 articles per month',
      'Full AI content workflow',
      '25 social media generations/month',
      'Streaming content generation',
      '75 AI improvements & 50 regenerations',
      '50 keyword research queries',
      '3 site connections',
      'Advanced SEO analysis & scoring',
      'WordPress multi-site publishing',
      'Social media content generation',
      'Editorial calendar with scheduling',
      'Unsplash image integration',
      'Email support (48h)',
      'Rollover up to 10 articles',
    ],
    limits: {
      articlesPerMonth: 25,
      aiImprovementsPerMonth: 75,
      sectionRegenerationsPerMonth: 50,
      researchQueriesPerMonth: 50,
      socialGenerationsPerMonth: 25,
      siteConnections: 3,
      templates: 'all',
      bulkGeneration: 0,
      versionHistoryDays: 30,
      support: 'email',
      hasWatermark: false,
      rolloverLimit: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    annualPrice: 490,
    description: 'Best for professionals and agencies',
    features: [
      '100 articles per month',
      'Priority AI processing',
      '100 social media generations/month',
      '300 AI improvements & 200 regenerations',
      'Unlimited keyword research',
      '10 site connections',
      'Bulk article operations (10 at once)',
      'Advanced competitor analysis',
      'Content repurposing tools',
      'WordPress automation',
      'Social media automation',
      'Usage analytics & reporting',
      'Priority support (24h)',
      'Rollover up to 25 articles',
    ],
    limits: {
      articlesPerMonth: 100,
      aiImprovementsPerMonth: 300,
      sectionRegenerationsPerMonth: 200,
      researchQueriesPerMonth: 999999, // Unlimited
      socialGenerationsPerMonth: 100,
      siteConnections: 10,
      templates: 'unlimited',
      bulkGeneration: 10,
      versionHistoryDays: 90,
      support: 'priority',
      hasWatermark: false,
      rolloverLimit: 25,
    },
    popular: true,
  },
};

export interface UsageStats {
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  rolloverArticles: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Check if user has reached a usage limit
 */
export function hasReachedLimit(
  usage: number,
  limit: number,
  rollover: number = 0
): boolean {
  return usage >= limit + rollover;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(
  usage: number,
  limit: number,
  rollover: number = 0
): number {
  const total = limit + rollover;
  return Math.min(100, Math.round((usage / total) * 100));
}

/**
 * Get remaining usage
 */
export function getRemainingUsage(
  usage: number,
  limit: number,
  rollover: number = 0
): number {
  return Math.max(0, limit + rollover - usage);
}

/**
 * Calculate cost per article
 */
export function getCostPerArticle(plan: PlanTier): string {
  const planDetails = PLANS[plan];
  if (planDetails.price === 0) return 'Free';
  const cost = planDetails.price / planDetails.limits.articlesPerMonth;
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate annual savings
 */
export function getAnnualSavings(plan: PlanTier): number {
  const planDetails = PLANS[plan];
  const monthlyTotal = planDetails.price * 12;
  return monthlyTotal - planDetails.annualPrice;
}

/**
 * Get annual savings percentage
 */
export function getAnnualSavingsPercentage(plan: PlanTier): number {
  const planDetails = PLANS[plan];
  if (planDetails.price === 0) return 0;
  const monthlyTotal = planDetails.price * 12;
  return Math.round(((monthlyTotal - planDetails.annualPrice) / monthlyTotal) * 100);
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(
  userPlan: PlanTier,
  requiredPlan: PlanTier
): boolean {
  const planOrder: PlanTier[] = ['free', 'starter', 'pro'];
  const userIndex = planOrder.indexOf(userPlan);
  const requiredIndex = planOrder.indexOf(requiredPlan);
  return userIndex >= requiredIndex;
}

/**
 * Get upgrade suggestions based on usage
 */
export function getUpgradeSuggestion(
  currentPlan: PlanTier,
  usage: UsageStats
): { shouldUpgrade: boolean; reason: string; suggestedPlan: PlanTier } | null {
  const limits = PLANS[currentPlan].limits;

  // Check if hitting article limit frequently
  if (usage.articlesUsed >= limits.articlesPerMonth * 0.9) {
    const nextPlan = currentPlan === 'free' ? 'starter' : 'pro';
    return {
      shouldUpgrade: true,
      reason: `You're using ${usage.articlesUsed} of ${limits.articlesPerMonth} articles. Upgrade for more!`,
      suggestedPlan: nextPlan,
    };
  }

  // Check if hitting AI improvements limit
  if (usage.aiImprovementsUsed >= limits.aiImprovementsPerMonth * 0.9) {
    const nextPlan = currentPlan === 'free' ? 'starter' : 'pro';
    return {
      shouldUpgrade: true,
      reason: `You're using ${usage.aiImprovementsUsed} of ${limits.aiImprovementsPerMonth} AI improvements. Upgrade for more!`,
      suggestedPlan: nextPlan,
    };
  }

  return null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get user's current plan from database
 */
export async function getUserPlan(_db: any, uid: string): Promise<PlanDetails> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { planTier: true } });
    const planTier = (user?.planTier as PlanTier) || "free";
    return PLANS[planTier];
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return PLANS.free;
  }
}
