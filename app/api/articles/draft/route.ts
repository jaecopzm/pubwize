import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateDraftStream } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import type { ArticleDoc } from "@/lib/types";

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
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // 3. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId, targetWordCount: bodyWordCount } = body;

  // 4. Validate article ID
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || "Invalid article ID");

  // 5. Fetch and validate article
  const articleRef = db.collection("articles").doc(articleId);
  const articleSnap = await articleRef.get();

  assertValid(articleSnap.exists, "Article not found");

  const articleData = articleSnap.data() as ArticleDoc;

  assertValid(articleData.ownerId === uid, "You don't have permission to access this article");
  assertValid(!!articleData.outline, "No outline found. Please generate an outline first.");
  assertValid(!!articleData.keyword, "Article missing keyword");

  // 6. Stream draft generation
  const tone = articleData.settings?.tone ?? "neutral";
  const targetWordCount = bodyWordCount || articleData.settings?.targetWordCount || 2000;
  const lsiKeywords = articleData.optimizations?.lsiKeywords || [];

  // Fetch site brand voice (now holds adjectives + optional persona fields)
  const siteSnap = await db.collection("sites").doc(articleData.siteId).get();
  const siteBrandVoice = siteSnap.exists ? siteSnap.data()?.brandVoice || null : null;

  // Fetch user's other published articles for internal linking
  const otherArticlesSnap = await db.collection("articles")
    .where("ownerId", "==", uid)
    .where("publishedUrl", "!=", null)
    .limit(20)
    .get();
  const internalLinkArticles = otherArticlesSnap.docs
    .filter(doc => doc.id !== articleId)
    .map(doc => ({ keyword: doc.data().keyword as string, publishedUrl: doc.data().publishedUrl as string | null }));

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let fullContent = "";

  (async () => {
    try {
      const generator = generateDraftStream({
        outline: articleData.outline as any,
        keyword: articleData.keyword!,
        tone,
        targetWordCount,
        lsiKeywords,
        siteBrandVoice,
        internalLinkArticles,
      });

      for await (const chunk of generator) {
        fullContent += chunk;
        // Send as SSE data event
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

      // Save the complete draft to Firestore
      const draft = { content: fullContent, format: "markdown" };
      const now = new Date();
      await articleRef.update({
        draft,
        status: "draft_generated",
        settings: {
          ...articleData.settings,
          targetWordCount,
        },
        updatedAt: now,
      });


      // Send a done event with the article ID
      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, articleId })}\n\n`));
    } catch (err) {
      console.error("Streaming draft generation failed:", err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "Generation failed. Please try again." })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
      "Content-Encoding": "none",
    },
  });
});