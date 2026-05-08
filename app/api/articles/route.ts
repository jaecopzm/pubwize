import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit } from "@/lib/api-security";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";

export const GET = withRateLimit(withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  logger.request("GET", "/api/articles", { userId: uid });

  const cacheKey = cacheKeys.articles(uid);
  const cached = await cache.get<any[]>(cacheKey);
  if (cached) {
    logger.cache("hit", cacheKey, { userId: uid });
    return NextResponse.json({ articles: cached });
  }

  logger.cache("miss", cacheKey, { userId: uid });

  const articles = await prisma.article.findMany({
    where: { ownerId: uid },
    orderBy: { createdAt: "desc" },
  });

  await cache.set(cacheKey, articles, cacheTTL.articles);
  logger.cache("set", cacheKey, { userId: uid, count: articles.length });

  return NextResponse.json({ articles });
}), "read");
