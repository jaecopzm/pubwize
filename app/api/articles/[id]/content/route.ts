import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { withErrorHandler, assertValid, NotFoundError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit } from "@/lib/api-security";
import { validateArticleId, validateContent } from "@/lib/validation";

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Rate limit (60 req/min for write operations)
  const rateLimit = checkRateLimit(uid, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate article ID
  const { id } = await params;
  const idValidation = validateArticleId(id);
  assertValid(idValidation.valid, idValidation.error || "Invalid article ID");

  // 4. Validate request body
  const { content } = await req.json();
  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || "Invalid content");

  // 5. Fetch and verify article
  const db = adminDb();
  const articleRef = db.collection("articles").doc(id);
  const articleSnap = await articleRef.get();

  if (!articleSnap.exists) {
    throw new NotFoundError("Article");
  }

  const articleData = articleSnap.data();
  assertValid(articleData?.ownerId === uid, "You don't have permission to update this article");

  // 6. Update draft content
  await articleRef.update({
    "draft.content": content,
    updatedAt: new Date(),
  });

  // 7. Return success
  return NextResponse.json({ success: true });
});