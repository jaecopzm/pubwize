import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { OutlineData } from "@/lib/types";
import { generateOutline } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Fetch and validate article
  const db = adminDb();

  // 3. Rate limit (30 req/min for AI operations)
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

  // 4. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId } = body;

  // 4. Validate article ID
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || "Invalid article ID");

  // 5. Fetch and validate article
  const articleRef = db.collection("articles").doc(articleId);
  const articleSnap = await articleRef.get();

  assertValid(articleSnap.exists, "Article not found");

  const articleData = articleSnap.data() as {
    ownerId?: string;
    brief?: unknown;
    keyword?: string;
    settings?: { tone?: string; targetWordCount?: number | null };
  };

  assertValid(articleData.ownerId === uid, "You don't have permission to access this article");
  assertValid(!!articleData.brief, "No SEO brief found. Please generate a brief first.");

  // 6. Generate outline
  let outline: OutlineData;
  try {
    outline = await generateOutline({
      brief: articleData.brief as any,
      keyword: articleData.keyword!,
    });
  } catch (err) {
    console.error("OpenRouter outline generation failed:", err);
    throw new ExternalServiceError("AI generation service", err);
  }

  // 7. Update article
  const now = new Date();
  await articleRef.update({
    outline,
    status: "outline_generated",
    updatedAt: now,
  });


  // 9. Return success
  return NextResponse.json({
    articleId,
    outline,
  });
});