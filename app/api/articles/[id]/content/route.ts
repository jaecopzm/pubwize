import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateArticleId, validateContent } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { asDraft } from "@/lib/prisma-json";

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

  const { content } = await req.json();
  assertValid(validateContent(content).valid, validateContent(content).error || "Invalid content");

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new NotFoundError("Article");
  assertValid(article.ownerId === uid, "You don't have permission to update this article");

  const existingDraft = asDraft(article.draft) || {};
  await prisma.article.update({
    where: { id },
    data: { draft: { ...existingDraft, content } },
  });

  await invalidateArticleCache(id, uid);

  return NextResponse.json({ success: true });
});
