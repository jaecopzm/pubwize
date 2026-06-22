import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateArticleId } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = await checkRateLimitByIdentifier(uid, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  assertValid(validateArticleId(id).valid, "Invalid article ID");

  const body = await req.json().catch(() => ({}));
  const featuredImage = body?.featuredImage ?? null;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new NotFoundError("Article");
  assertValid(article.ownerId === uid, "You don't have permission to update this article");

  // We store featured image as JSON on the Article record.
  // Expected shape (recommended):
  // { url, photographer?, photographerUrl?, unsplashId? }
  await prisma.article.update({
    where: { id },
    data: { featuredImage },
  });

  await invalidateArticleCache(id, uid);

  return NextResponse.json({ success: true, featuredImage });
});

