import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanTier } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, email: "", planTier: "free", periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
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
    console.error("Error fetching usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
