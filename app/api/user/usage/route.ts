import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanTier } from "@/lib/pricing";
import { ensureUserRecord } from "@/lib/ensure-user";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const ensured = await ensureUserRecord(userId, {
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null,
        photoURL: clerkUser.imageUrl || null,
      });

      user = ensured.user;
    }

    const plan = (user.planTier as PlanTier) || "free";
    const limits = PLANS[plan].limits;

    return NextResponse.json({
      plan,
      limits,
      usage: {
        articlesUsed: user.articlesUsed,
        aiImprovementsUsed: user.aiImprovementsUsed,
        sectionRegenerationsUsed: user.sectionRegenerationsUsed,
        rolloverArticles: user.rolloverArticles,
      },
      periodStart: user.periodStart,
      periodEnd: user.periodEnd,
    });
  } catch (error) {
    logger.error("Error fetching usage", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
