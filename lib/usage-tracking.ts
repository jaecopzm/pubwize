import { prisma } from "@/lib/prisma";
import { PLANS, hasReachedLimit, type PlanTier, type PlanLimits } from "./pricing";
import { invalidateUsageCache } from "./cache-invalidation";

export type UsageType =
  | "articles"
  | "aiImprovements"
  | "sectionRegenerations"
  | "researchQueries"
  | "socialGeneration";

export interface UserUsage {
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  researchQueriesUsed: number;
  socialGenerationUsed: number;
  rolloverArticles: number;
  periodStart: Date;
  periodEnd: Date;
}

type UsageField = "articlesUsed" | "aiImprovementsUsed" | "sectionRegenerationsUsed" | "researchQueriesUsed" | "socialGenerationUsed";
type NumericLimitKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
}[keyof PlanLimits];

interface UsageConfig {
  field: UsageField;
  limitKey: NumericLimitKey;
  allowRollover: boolean;
}

const USAGE_CONFIG: Record<UsageType, UsageConfig> = {
  articles:            { field: "articlesUsed",            limitKey: "articlesPerMonth",            allowRollover: true },
  aiImprovements:      { field: "aiImprovementsUsed",      limitKey: "aiImprovementsPerMonth",      allowRollover: false },
  sectionRegenerations: { field: "sectionRegenerationsUsed", limitKey: "sectionRegenerationsPerMonth", allowRollover: false },
  researchQueries:     { field: "researchQueriesUsed",     limitKey: "researchQueriesPerMonth",     allowRollover: false },
  socialGeneration:    { field: "socialGenerationUsed",    limitKey: "socialGenerationsPerMonth",   allowRollover: false },
};

interface UsageUser {
  planTier: string;
  rolloverArticles: number;
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  researchQueriesUsed: number;
  socialGenerationUsed: number;
}

function resolveUsage(user: UsageUser, type: UsageType) {
  const cfg = USAGE_CONFIG[type];
  const plan = (user.planTier as PlanTier) || "free";
  const limits = PLANS[plan].limits;
  const current = user[cfg.field];
  const limit = limits[cfg.limitKey] as number;
  const rollover = cfg.allowRollover ? user.rolloverArticles : 0;
  return { plan, limit, current, rollover, totalLimit: limit + rollover };
}

export async function incrementUsage(
  userId: string,
  type: UsageType
): Promise<void> {
  const cfg = USAGE_CONFIG[type];

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const { plan, current, totalLimit, rollover } = resolveUsage(user, type);

    if (hasReachedLimit(current, totalLimit - rollover, rollover)) {
      const nextTier = plan === "free" ? "Starter" : "Pro";
      throw Object.assign(
        new Error(`You've used ${current}/${totalLimit} this month. Upgrade to ${nextTier} for more.`),
        { code: "QUOTA_EXCEEDED" as const, current, limit: totalLimit, quotaType: type }
      );
    }

    await tx.user.update({
      where: { id: userId },
      data: { [cfg.field]: { increment: 1 }, updatedAt: new Date() },
    });
  });

  await invalidateUsageCache(userId);
}

export async function canPerformAction(
  userId: string,
  type: UsageType
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { allowed: false, reason: "User not found" };

    const { plan, current, totalLimit, rollover } = resolveUsage(user, type);

    if (hasReachedLimit(current, totalLimit - rollover, rollover)) {
      const nextTier = plan === "free" ? "Starter" : "Pro";
      return {
        allowed: false,
        reason: `You've used ${current}/${totalLimit} this month. Upgrade to ${nextTier} for more.`,
        current,
        limit: totalLimit,
      };
    }

    return { allowed: true, current, limit: totalLimit };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: false, reason: "Failed to check usage limits" };
  }
}

export async function getUserUsage(
  userId: string
): Promise<UserUsage | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    articlesUsed: user.articlesUsed,
    aiImprovementsUsed: user.aiImprovementsUsed,
    sectionRegenerationsUsed: user.sectionRegenerationsUsed,
    researchQueriesUsed: user.researchQueriesUsed,
    socialGenerationUsed: user.socialGenerationUsed,
    rolloverArticles: user.rolloverArticles,
    periodStart: user.periodStart,
    periodEnd: user.periodEnd,
  };
}

export async function resetMonthlyUsage(
  userId: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const plan = (user.planTier as PlanTier) || "free";
  const limits = PLANS[plan].limits;
  const unusedArticles = Math.max(0, limits.articlesPerMonth - user.articlesUsed);
  const rollover = Math.min(unusedArticles, limits.rolloverLimit);

  await prisma.user.update({
    where: { id: userId },
    data: {
      articlesUsed: 0,
      aiImprovementsUsed: 0,
      sectionRegenerationsUsed: 0,
      researchQueriesUsed: 0,
      socialGenerationUsed: 0,
      rolloverArticles: rollover,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  });

  await invalidateUsageCache(userId);
}
