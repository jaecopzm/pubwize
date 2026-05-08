import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchSerpContext, fetchKeywordSuggestions } from "@/lib/serper";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateKeyword } from "@/lib/validation";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";

async function keywordResearchHandler(req: NextRequest) {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many research requests." }, { status: 429 });
  }

  const body = await req.json();
  const validation = validateRequestBody(body, ["query"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { query } = body;
  assertValid(validateKeyword(query).valid, validateKeyword(query).error || "Invalid query");

  const cacheKey = cacheKeys.keywordResearch(query.toLowerCase().trim());
  const cached = await cache.get<any>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const usageCheck = await canPerformAction(null, uid, "researchQueries");
  if (!usageCheck.allowed) {
    throw new QuotaExceededError(usageCheck.reason || "Research query limit reached", usageCheck.current || 0, usageCheck.limit || 0, "researchQueries");
  }

  let serp, suggestions;
  try {
    [serp, suggestions] = await Promise.all([fetchSerpContext(query), fetchKeywordSuggestions(query)]);
  } catch (serpErr) {
    throw new ExternalServiceError("Keyword research service", serpErr);
  }

  await incrementUsage(null, uid, "researchQueries");

  const safeString = (v: any): string => (typeof v === "object" && v !== null && "value" in v ? String(v.value) : String(v ?? ""));

  const results = {
    seed: safeString(query),
    suggestions: suggestions.map((s: any) => ({ keyword: safeString(s), type: "suggested" })),
    peopleAlsoAsk: serp.peopleAlsoAsk.map((q: any) => ({ keyword: safeString(q.question), type: "question" })),
    related: serp.relatedSearches.map((r: any) => ({ keyword: safeString(r.query), type: "related" })),
    all: [
      ...suggestions.map((s: any) => ({ keyword: safeString(s), type: "suggested" })),
      ...serp.peopleAlsoAsk.map((q: any) => ({ keyword: safeString(q.question), type: "question" })),
      ...serp.relatedSearches.map((r: any) => ({ keyword: safeString(r.query), type: "related" })),
    ].filter((v, i, a) => a.findIndex((t) => t.keyword === v.keyword) === i),
  };

  await cache.set(cacheKey, results, cacheTTL.keywordResearch);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  return withErrorHandler(keywordResearchHandler)(req);
}
