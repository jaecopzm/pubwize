import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

const PLAN_PRICES: Record<string, number> = { starter: 19, pro: 49 };

export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activeUsers = await prisma.user.findMany({
    where: { planStatus: "active" },
    select: { planTier: true, cancelledAt: true },
  });

  let mrr = 0;
  let paidUsers = 0;
  let churnedThisMonth = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const u of activeUsers) {
    const price = PLAN_PRICES[u.planTier] ?? 0;
    if (price > 0) {
      mrr += price;
      paidUsers++;
    }
    if (u.cancelledAt && new Date(u.cancelledAt) >= thirtyDaysAgo) churnedThisMonth++;
  }

  const totalUsers = await prisma.user.count();

  return NextResponse.json({
    mrr,
    paidUsers,
    freeUsers: totalUsers - paidUsers,
    totalUsers,
    conversionRate: totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0",
    churnedThisMonth,
  });
});
