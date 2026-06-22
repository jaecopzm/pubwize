import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";

const PAGE_SIZE = 50;

export const GET = withRateLimit(withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  logger.request("GET", "/api/articles", { userId: uid });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit")) || PAGE_SIZE, 100);

  const cacheKey = cursor ? `${cacheKeys.articles(uid)}:cursor:${cursor}` : cacheKeys.articles(uid);
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    logger.cache("hit", cacheKey, { userId: uid });
    return NextResponse.json(cached);
  }

  logger.cache("miss", cacheKey, { userId: uid });

  const articles = await prisma.article.findMany({
    where: { ownerId: uid },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = articles.length > limit;
  const result = hasMore ? articles.slice(0, limit) : articles;
  const nextCursor = hasMore ? result[result.length - 1].id : null;

  const responsePayload = { articles: result, nextCursor };

  await cache.set(cacheKey, responsePayload, cacheTTL.articles);
  logger.cache("set", cacheKey, { userId: uid, count: result.length });

  return NextResponse.json(responsePayload);
}), "read");
