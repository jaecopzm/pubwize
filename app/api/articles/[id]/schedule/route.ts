import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { scheduleArticle, unscheduleArticle } from "@/lib/services/content-calendar";
import { invalidateCalendarCache, invalidateArticleCache } from "@/lib/cache-invalidation";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

async function scheduleHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: articleId } = await params;
    const { scheduledDate } = await request.json();

    if (!scheduledDate) return NextResponse.json({ error: "scheduledDate is required" }, { status: 400 });

    const date = new Date(scheduledDate);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date format" }, { status: 400 });

    await scheduleArticle(null, articleId, userId, date);
    await Promise.all([invalidateCalendarCache(userId), invalidateArticleCache(articleId, userId)]);

    logger.info("Article scheduled", { articleId, userId });
    return NextResponse.json({ success: true, scheduledDate: date.toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("not found")) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (msg.includes("Unauthorized")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (msg.includes("Cannot schedule")) return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.json({ error: "Failed to schedule article" }, { status: 500 });
  }
}

export const POST = withRateLimit(scheduleHandler, "write");

async function unscheduleHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: articleId } = await params;
    await unscheduleArticle(null, articleId, userId);
    await Promise.all([invalidateCalendarCache(userId), invalidateArticleCache(articleId, userId)]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("not found")) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (msg.includes("Unauthorized")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to unschedule article" }, { status: 500 });
  }
}

export const DELETE = withRateLimit(unscheduleHandler, "write");
