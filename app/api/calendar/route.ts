import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";

async function getCalendarHandler(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) return NextResponse.json({ error: "year and month are required" }, { status: 400 });

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
    }

    const cacheKey = cacheKeys.calendarEvents(userId, yearNum, monthNum);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const articles = await prisma.article.findMany({
      where: { ownerId: userId, scheduledDate: { gte: startDate, lte: endDate } },
    });

    const events = articles.map((a) => ({
      id: a.id,
      articleId: a.id,
      title: a.keyword || "Untitled Article",
      status: a.status,
      authorId: a.ownerId,
      authorName: "Author",
      scheduledDate: a.scheduledDate,
    }));

    const result = { events, year: yearNum, month: monthNum };
    await cache.set(cacheKey, result, cacheTTL.calendarEvents);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching calendar events", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

export const GET = withRateLimit(getCalendarHandler, "read");
