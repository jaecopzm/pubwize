import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetMonthlyUsage } from "@/lib/usage-tracking";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

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

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((user) => resetMonthlyUsage(user.id))
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          resetCount++;
        } else {
          const userId = batch[j].id;
          logger.error(`Failed to reset usage for user ${userId}`, result.reason);
          errors.push(userId);
        }
      }
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    return NextResponse.json({ success: true, resetCount, errorCount: errors.length, errors: errors.slice(0, 10) });
  } catch (error) {
    logger.error("[Cron] Usage reset failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
