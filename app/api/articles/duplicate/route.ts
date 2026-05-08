import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError, QuotaExceededError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const usageCheck = await canPerformAction(null, uid, "articles");
  if (!usageCheck.allowed) {
    throw new QuotaExceededError(usageCheck.reason || "Article limit reached", usageCheck.current || 0, usageCheck.limit || 0, "articles");
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article");
  assertValid(article.ownerId === uid, "You don't have permission to duplicate this article");

  const newArticle = await prisma.article.create({
    data: {
      ownerId: uid,
      siteId: article.siteId,
      keyword: `${article.keyword} (Copy)`,
      status: article.status,
      intent: article.intent,
      articleType: article.articleType,
      brief: article.brief ?? undefined,
      outline: article.outline ?? undefined,
      draft: article.draft ?? undefined,
      optimizations: article.optimizations ?? undefined,
      settings: article.settings ?? undefined,
    },
  });

  await incrementUsage(null, uid, "articles");

  return NextResponse.json({ success: true, articleId: newArticle.id });
});
