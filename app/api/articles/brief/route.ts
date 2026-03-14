import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  GenerateBriefRequestBody,
  GenerateBriefResponse,
} from "@/lib/types";
import { generateBrief } from "@/lib/ai-providers";
import { fetchSerpContext } from "@/lib/serper";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateKeyword } from "@/lib/validation";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  console.log("[Dev] Recompiled brief API route - using fresh OpenRouter logic");

  // 2. Rate limit (30 req/min for AI operations)
  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate request body
  const body = (await req.json()) as GenerateBriefRequestBody;
  const validation = validateRequestBody(body, ["keyword", "siteId"], ["tone", "targetWordCount"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { keyword, siteId } = body;

  // 4. Validate keyword
  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 5. Check usage quota
  const db = adminDb();
  const usageCheck = await canPerformAction(db, uid, "articles");

  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || "Article limit reached",
      usageCheck.current || 0,
      usageCheck.limit || 0,
      "articles"
    );
  }

  // 6. Initialize user if needed
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  let userData = userSnap.data() as {
    planTier?: string;
    niche?: string;
    targetCountry?: string;
    language?: string;
    brandVoice?: { adjectives?: string[] };
  } | undefined;

  if (!userSnap.exists) {
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    userData = {
      planTier: "free",
    };

    await userRef.set({
      ...userData,
      createdAt: now,
      updatedAt: now,
      usage: {
        articlesUsed: 0,
        aiImprovementsUsed: 0,
        sectionRegenerationsUsed: 0,
        researchQueriesUsed: 0,
        rolloverArticles: 0,
        periodStart: now,
        periodEnd: inThirtyDays,
      },
    });
  }

  // 7. Validate site ownership
  const siteRef = db.collection("sites").doc(siteId);
  const siteSnap = await siteRef.get();

  assertValid(siteSnap.exists, "Site not found");

  const siteData = siteSnap.data() as {
    ownerId?: string;
    niche?: string;
    targetCountry?: string;
    language?: string;
    brandVoice?: { adjectives?: string[] };
  };

  assertValid(siteData.ownerId === uid, "You don't have permission to access this site");

  // 8. Fetch SERP context for Pro users
  let serpContext = undefined;
  if (userData?.planTier === "pro") {
    try {
      serpContext = await fetchSerpContext(keyword, siteData.targetCountry ?? "us");
    } catch (serpErr) {
      console.warn("SERP fetch failed, falling back to standard brief:", serpErr);
    }
  }

  // 9. Generate brief
  let brief;
  try {
    brief = await generateBrief({
      keyword,
      siteContext: {
        niche: siteData.niche,
        targetCountry: siteData.targetCountry,
        language: siteData.language,
        brandVoice: siteData.brandVoice || undefined,
      },
      serpContext,
    });
  } catch (err) {
    console.error("OpenRouter brief generation failed:", err);
    throw new ExternalServiceError("AI generation service", err);
  }

  // 10. Create article
  const now = new Date();
  const articleRef = db.collection("articles").doc();

  await articleRef.set({
    ownerId: uid,
    siteId,
    keyword,
    status: "brief_generated",
    intent: brief.intent,
    articleType: brief.articleType,
    brief,
    outline: null,
    draft: null,
    optimizations: null,
    settings: {
      tone: body.tone ?? "neutral",
      targetWordCount: body.targetWordCount ?? null,
    },
    createdAt: now,
    updatedAt: now,
  });

  // 11. Increment usage counter
  await incrementUsage(db, uid, "articles");

  // 12. Return success
  const response: GenerateBriefResponse = {
    articleId: articleRef.id,
    brief,
    intent: brief.intent,
    articleType: brief.articleType,
  };

  return NextResponse.json(response);
});