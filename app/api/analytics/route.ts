import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { asDraft } from "@/lib/prisma-json";
import { withRateLimit } from "@/lib/rate-limit";
import { PLANS } from "@/lib/pricing";
import type { PlanTier } from "@/lib/types";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan = (user.planTier as PlanTier) || "free";
    const limits = PLANS["pro"].limits; // display Pro limits

    const [articles, totalSites] = await Promise.all([
      prisma.article.findMany({ where: { ownerId: uid } }),
      prisma.site.count({ where: { ownerId: uid } }),
    ]);

    const statusBreakdown = {
      brief: articles.filter((a) => a.status === "brief").length,
      outline: articles.filter((a) => a.status === "outline").length,
      draft: articles.filter((a) => a.status === "draft").length,
      optimized: articles.filter((a) => a.status === "optimized").length,
    };

    const articlesWithContent = articles.filter((a) => {
      const draft = asDraft(a.draft);
      return draft?.content && draft.content.length > 100;
    });

    const avgWordCount =
      articlesWithContent.length > 0
        ? Math.round(
            articlesWithContent.reduce((sum, a) => {
              const content = asDraft(a.draft)?.content || "";
              return sum + content.replace(/\s+/g, " ").trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            }, 0) / articlesWithContent.length
          )
        : 0;

    const planPrice = plan === "pro" ? 49 : plan === "starter" ? 19 : 0;
    const articlesGenerated = user.articlesUsed;
    const costPerArticle = articlesGenerated > 0 && planPrice > 0 ? (planPrice / articlesGenerated).toFixed(2) : planPrice === 0 ? "Free" : "0.00";
    const timeSavedHours = Math.round(articlesGenerated * 3.5);
    const valueGenerated = articlesGenerated * 150;
    const roiMultiple = planPrice > 0 && valueGenerated > 0 ? Math.round((valueGenerated / planPrice) * 10) / 10 : 0;

    return NextResponse.json({
      plan: "pro",
      actualPlan: plan,
      usage: {
        articlesUsed: user.articlesUsed,
        articlesLimit: limits.articlesPerMonth,
        aiImprovementsUsed: user.aiImprovementsUsed,
        aiImprovementsLimit: limits.aiImprovementsPerMonth,
        sectionRegenerationsUsed: user.sectionRegenerationsUsed,
        sectionRegenerationsLimit: limits.sectionRegenerationsPerMonth,
        researchQueriesUsed: user.researchQueriesUsed,
        researchQueriesLimit: limits.researchQueriesPerMonth,
        socialGenerationUsed: user.socialGenerationUsed,
        socialGenerationLimit: limits.socialGenerationsPerMonth,
        rolloverArticles: user.rolloverArticles,
      },
      stats: {
        totalArticles: articles.length,
        totalSites,
        statusBreakdown,
        periodStart: user.periodStart,
        periodEnd: user.periodEnd,
      },
      insights: { avgWordCount, articlesWithContent: articlesWithContent.length },
      roi: { costPerArticle, timeSavedHours, valueGenerated, breakEven: roiMultiple },
    });
  } catch (error) {
    logger.error("Analytics error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "read");
