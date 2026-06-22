import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: uid } });
    const plan = user?.planTier || "free";

    const [totalArticles, totalSites, lastArticle] = await Promise.all([
      prisma.article.count({ where: { ownerId: uid } }),
      prisma.site.count({ where: { ownerId: uid } }),
      prisma.article.findFirst({
        where: { ownerId: uid },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return NextResponse.json({
      totalArticles,
      totalSites,
      articlesThisMonth: user?.articlesUsed || 0,
      lastActivity: lastArticle?.updatedAt || null,
      planTier: plan,
    });
  } catch (error) {
    logger.error("Error fetching stats", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
