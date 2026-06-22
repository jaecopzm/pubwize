import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalArticles, totalSites, planBreakdown, recentSignups, recentArticles] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.site.count(),
    prisma.user.groupBy({ by: ["planTier"], _count: { id: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.article.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const planBreakdownMap: Record<string, number> = {};
  for (const row of planBreakdown) {
    planBreakdownMap[row.planTier || "none"] = row._count.id;
  }

  return NextResponse.json({ totalUsers, totalArticles, totalSites, planBreakdown: planBreakdownMap, recentSignups, recentArticles });
});
