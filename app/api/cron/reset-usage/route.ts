import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetMonthlyUsage } from "@/lib/usage-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    let resetCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        await resetMonthlyUsage(null, user.id);
        resetCount++;
      } catch (error) {
        console.error(`Failed to reset usage for user ${user.id}:`, error);
        errors.push(user.id);
      }
    }

    return NextResponse.json({ success: true, resetCount, errorCount: errors.length, errors: errors.slice(0, 10) });
  } catch (error) {
    console.error("[Cron] Usage reset failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
