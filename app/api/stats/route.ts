import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();

    // Get user data for plan tier
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const plan = userData?.planTier || userData?.plan || "free";

    // Get total articles count
    const articlesSnapshot = await db
      .collection("articles")
      .where("ownerId", "==", uid)
      .count()
      .get();

    // Get total sites count
    const sitesSnapshot = await db
      .collection("sites")
      .where("ownerId", "==", uid)
      .count()
      .get();

    // Get articles this month from usage data (more accurate)
    const usage = userData?.usage || {};
    const articlesThisMonth = usage.articlesUsed || 0;

    // Get last activity (most recent article)
    const lastArticleSnapshot = await db
      .collection("articles")
      .where("ownerId", "==", uid)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    const lastActivity = lastArticleSnapshot.empty
      ? null
      : lastArticleSnapshot.docs[0].data().updatedAt;

    return NextResponse.json({
      totalArticles: articlesSnapshot.data().count,
      totalSites: sitesSnapshot.data().count,
      articlesThisMonth,
      lastActivity,
      planTier: plan,
    });
  } catch (error) {
    console.error("Error fetching stats", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
