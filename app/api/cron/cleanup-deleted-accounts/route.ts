import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// This endpoint should be called by a cron job (e.g., daily)
// Vercel Cron: https://vercel.com/docs/cron-jobs
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Delete expired deleted_accounts records
    const expiredQuery = await db.collection("deleted_accounts")
      .where("expiresAt", "<", ninetyDaysAgo)
      .limit(500)
      .get();

    const batch = db.batch();
    let deleteCount = 0;

    expiredQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    if (deleteCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      deletedRecords: deleteCount,
      message: `Cleaned up ${deleteCount} expired deletion records`
    });
  } catch (error) {
    console.error("Error cleaning up deleted accounts:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
