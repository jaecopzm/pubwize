import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { fetchSerpContext, fetchKeywordSuggestions } from "@/lib/serper";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateKeyword } from "@/lib/validation";
import { withRateLimit } from "@/lib/rate-limit";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";

async function keywordResearchHandler(req: NextRequest) {
  const startTime = Date.now();
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Rate limit (10 req/min for SERP API - cost control)
  const rateLimit = checkRateLimit(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many research requests. Please try again later." },
      { 
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["query"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { query } = body;

  // 4. Validate query
  const queryValidation = validateKeyword(query);
  assertValid(queryValidation.valid, queryValidation.error || "Invalid query");

  // 5. Check cache first (keyword research is expensive)
  const cacheKey = cacheKeys.keywordResearch(query.toLowerCase().trim());
  const cached = await cache.get<any>(cacheKey);
  
  if (cached) {
    logger.cache('hit', cacheKey, { userId: uid, query });
    logger.response('POST', '/api/research/keywords', 200, Date.now() - startTime, { cached: true });
    return NextResponse.json(cached);
  }

  logger.cache('miss', cacheKey, { userId: uid, query });

  // 6. Check usage quota
  const db = adminDb();
  const usageCheck = await canPerformAction(db, uid, "researchQueries");
  
  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || "Research query limit reached",
      usageCheck.current || 0,
      usageCheck.limit || 0,
      "researchQueries"
    );
  }

  // 7. Fetch live data from SERP API
  let serp, suggestions;
  try {
    [serp, suggestions] = await Promise.all([
      fetchSerpContext(query),
      fetchKeywordSuggestions(query),
    ]);
  } catch (serpErr) {
    logger.error("SERP API failed", serpErr, { userId: uid, query });
    throw new ExternalServiceError("Keyword research service", serpErr);
  }

  // 8. Increment usage counter after successful research
  await incrementUsage(db, uid, "researchQueries");

  // 9. Format results for frontend
  const safeString = (v: any): string => {
    if (typeof v === "object" && v !== null && "value" in v) return String(v.value);
    return String(v ?? "");
  };

  const results = {
    seed: safeString(query),
    suggestions: suggestions.map(s => ({ keyword: safeString(s), type: "suggested" })),
    peopleAlsoAsk: serp.peopleAlsoAsk.map(q => ({ keyword: safeString(q.question), type: "question" })),
    related: serp.relatedSearches.map(r => ({ keyword: safeString(r.query), type: "related" })),
    all: [
      ...suggestions.map(s => ({ keyword: safeString(s), type: "suggested" })),
      ...serp.peopleAlsoAsk.map(q => ({ keyword: safeString(q.question), type: "question" })),
      ...serp.relatedSearches.map(r => ({ keyword: safeString(r.query), type: "related" })),
    ].filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i)
  };

  // 10. Cache the results (1 hour TTL)
  await cache.set(cacheKey, results, cacheTTL.keywordResearch);
  logger.cache('set', cacheKey, { userId: uid, query });

  // 11. Return success
  logger.response('POST', '/api/research/keywords', 200, Date.now() - startTime);
  return NextResponse.json(results);
}

// Wrap with error handler first, then rate limit
const handlerWithErrors = withErrorHandler(keywordResearchHandler);

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await import('@/lib/rate-limit').then(m => m.checkRateLimit(req, 'research'));
  
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Execute handler with error handling
  const response = await handlerWithErrors(req);
  
  // Add rate limit headers
  if (response instanceof NextResponse) {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
  }
  
  return response;
}