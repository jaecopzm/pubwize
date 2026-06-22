import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateArticleId } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = await checkRateLimitByIdentifier(uid, 120, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id: articleId } = await params;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article");

  assertValid(article.ownerId === uid, "You don't have permission to access this article");

  return NextResponse.json({ article });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const { id: articleId } = await params;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article");

  assertValid(article.ownerId === uid, "You don't have permission to delete this article");

  await prisma.article.delete({ where: { id: articleId } });
  await invalidateArticleCache(articleId, uid);

  return NextResponse.json({ success: true });
});
