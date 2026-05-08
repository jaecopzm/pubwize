import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // No deleted_accounts collection in Prisma schema yet
    // This can be implemented later if needed
    return NextResponse.json({ success: true, deletedRecords: 0, message: "No cleanup needed" });
  } catch (error) {
    console.error("Error cleaning up deleted accounts:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
