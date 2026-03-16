import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

const PLAN_PRICES: Record<string, number> = { starter: 19, pro: 49 };

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();

  const [activeSnap, totalSnap] = await Promise.all([
    db.collection("users").where("planStatus", "==", "active").select("planTier", "cancelledAt").get(),
    db.collection("users").count().get(),
  ]);

  let mrr = 0;
  let paidUsers = 0;
  let churnedThisMonth = 0;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const doc of activeSnap.docs) {
    const d = doc.data();
    const price = PLAN_PRICES[d.planTier] ?? 0;
    if (price > 0) { mrr += price; paidUsers++; }
    if (d.cancelledAt && new Date(d.cancelledAt) >= thirtyDaysAgo) churnedThisMonth++;
  }

  const totalUsers = totalSnap.data().count;

  return NextResponse.json({
    mrr,
    paidUsers,
    freeUsers: totalUsers - paidUsers,
    totalUsers,
    conversionRate: totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0",
    churnedThisMonth,
  });
}
