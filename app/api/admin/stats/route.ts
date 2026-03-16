import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();

  const [usersSnap, articlesSnap, sitesSnap] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("articles").count().get(),
    db.collection("sites").count().get(),
  ]);

  // Plan breakdown
  const planBreakdown: Record<string, number> = {};
  const usersWithPlan = await db.collection("users").select("planTier").get();
  for (const doc of usersWithPlan.docs) {
    const tier = doc.data().planTier ?? "none";
    planBreakdown[tier] = (planBreakdown[tier] ?? 0) + 1;
  }

  // Recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignupsSnap = await db
    .collection("users")
    .where("createdAt", ">=", sevenDaysAgo)
    .count()
    .get();

  // Recent articles (last 7 days)
  const recentArticlesSnap = await db
    .collection("articles")
    .where("createdAt", ">=", sevenDaysAgo)
    .count()
    .get();

  return NextResponse.json({
    totalUsers: usersSnap.data().count,
    totalArticles: articlesSnap.data().count,
    totalSites: sitesSnap.data().count,
    planBreakdown,
    recentSignups: recentSignupsSnap.data().count,
    recentArticles: recentArticlesSnap.data().count,
  });
}
