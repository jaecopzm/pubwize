import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit } from "@/lib/api-security";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";

export const GET = withRateLimit(withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  logger.request('GET', '/api/articles', { userId: uid });

  // 2. Try cache first
  const cacheKey = cacheKeys.articles(uid);
  const cached = await cache.get<any[]>(cacheKey);
  
  if (cached) {
    logger.cache('hit', cacheKey, { userId: uid });
    return NextResponse.json({ articles: cached });
  }

  logger.cache('miss', cacheKey, { userId: uid });

  // 3. Fetch from database
  const db = adminDb();
  logger.database('query', 'articles', { userId: uid });
  
  const articlesSnapshot = await db
    .collection("articles")
    .where("ownerId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  const articles = articlesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 4. Cache the result
  await cache.set(cacheKey, articles, cacheTTL.articles);
  logger.cache('set', cacheKey, { userId: uid, count: articles.length });

  // 5. Return success
  return NextResponse.json({ articles });
}), 'read');