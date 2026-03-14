import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { optimizeContentWithSEOSuggestions } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateContent, validateKeyword } from "@/lib/validation";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Check usage limits
  const db = adminDb();
  const usageCheck = await canPerformAction(db, uid, 'aiImprovements');
  
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { 
        error: usageCheck.reason || "AI improvement limit reached",
        upgradeRequired: true,
        current: usageCheck.current,
        limit: usageCheck.limit
      },
      { status: 403 }
    );
  }

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
  const validation = validateRequestBody(body, ["content", "keyword", "suggestions"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { content, keyword, suggestions } = body;

  // 4. Validate content and keyword
  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || "Invalid content");

  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 5. Generate optimized content
  let optimizedContent: string;
  try {
    optimizedContent = await optimizeContentWithSEOSuggestions({
      content,
      keyword,
      suggestions
    });
  } catch (err) {
    console.error("OpenRouter optimization failed:", err);
    throw new ExternalServiceError("AI optimization service", err);
  }

  // 6. Increment usage counter
  await incrementUsage(db, uid, 'aiImprovements');

  // 7. Return success
  return NextResponse.json({
    optimizedContent,
  });
});