/**
 * Usage tracking utilities - Neon/Prisma
 */

import { prisma } from "@/lib/prisma";
import { PLANS, hasReachedLimit, type PlanTier } from "./pricing";

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

export async function incrementUsage(
  _db: unknown,
  userId: string,
  type: UsageType
): Promise<void> {
  const field: Record<UsageType, string> = {
    articles: "articlesUsed",
    aiImprovements: "aiImprovementsUsed",
    sectionRegenerations: "sectionRegenerationsUsed",
    researchQueries: "researchQueriesUsed",
    socialGeneration: "socialGenerationUsed",
  };

  await prisma.user.update({
    where: { id: userId },
    data: { [field[type]]: { increment: 1 }, updatedAt: new Date() },
  });
}

export async function canPerformAction(
  _db: unknown,
  userId: string,
  type: UsageType
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return { allowed: false, reason: "User not found" };

    const plan = (user.planTier as PlanTier) || "free";
    const limits = PLANS[plan].limits;

    let current: number;
    let limit: number;
    let rollover = user.rolloverArticles;

    switch (type) {
      case "articles":
        current = user.articlesUsed;
        limit = limits.articlesPerMonth;
        break;
      case "aiImprovements":
        current = user.aiImprovementsUsed;
        limit = limits.aiImprovementsPerMonth;
        rollover = 0;
        break;
      case "sectionRegenerations":
        current = user.sectionRegenerationsUsed;
        limit = limits.sectionRegenerationsPerMonth;
        rollover = 0;
        break;
      case "researchQueries":
        current = user.researchQueriesUsed;
        limit = limits.researchQueriesPerMonth;
        rollover = 0;
        break;
      case "socialGeneration":
        current = user.socialGenerationUsed;
        limit = limits.socialGenerationsPerMonth;
        rollover = 0;
        break;
    }

    if (hasReachedLimit(current, limit, rollover)) {
      const nextTier = plan === "free" ? "Starter" : "Pro";
      return {
        allowed: false,
        reason: `You've used ${current}/${limit + rollover} this month. Upgrade to ${nextTier} for more.`,
        current,
        limit: limit + rollover,
      };
    }

    return { allowed: true, current, limit: limit + rollover };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    return { allowed: false, reason: "Failed to check usage limits" };
  }
}

export async function getUserUsage(
  _db: unknown,
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
  _db: unknown,
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
}
