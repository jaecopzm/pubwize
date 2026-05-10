import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { withRateLimit } from "@/lib/rate-limit";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { logger } from "@/lib/logger";
import { looksLikeHtml, markdownToHtml } from "@/lib/wordpress/markdown";

async function publishHandler(request: NextRequest) {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many publish requests." }, { status: 429 });
  }

  const body = await request.json();
  // Allow minimal payload from lightweight clients:
  // - `title` / `content` can be omitted and will be loaded from the Article record.
  const validation = validateRequestBody(body, ["articleId", "wordPressSiteId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const {
    articleId,
    wordPressSiteId,
    title: incomingTitle,
    content: incomingContent,
    status = "draft",
    categories = [],
    tags = [],
    featuredImageUrl,
    scheduledDate
  } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article");
  assertValid(article.ownerId === uid, "You don't have permission to publish this article");
  const draftJson = (article as any).draft as any;
  const draftContent =
    typeof draftJson === "object" && draftJson
      ? (draftJson.content ?? draftJson.html ?? "")
      : draftJson;

  const title = (incomingTitle ??
    (article as any).metaTitle ??
    (article as any).keyword ??
    "").toString().trim();

  const content = (incomingContent ??
    (article as any).content ??
    draftContent ??
    "").toString();
  assertValid(title.length > 0, "Missing article title");
  assertValid(content.trim().length > 0, "Missing article content");

  const wpSite = await prisma.wordPressSite.findUnique({ where: { id: wordPressSiteId } });
  if (!wpSite) throw new NotFoundError("WordPress site");
  assertValid(wpSite.userId === uid, "You don't have permission to use this WordPress site");

  const wpSiteFormatted = { id: wordPressSiteId, siteUrl: wpSite.siteUrl, username: wpSite.username, encryptedPassword: wpSite.encryptedPassword } as any;
  const { publishToWordPress } = await import("@/lib/wordpress/service");

  const contentHtml = looksLikeHtml(content) ? content : markdownToHtml(content);
  const scheduledDateObj =
    status === "future" && scheduledDate
      ? new Date(scheduledDate)
      : undefined;

  const wpResult = await publishToWordPress(
    wpSiteFormatted,
    title,
    contentHtml,
    {
      status,
      categories,
      tags,
      featuredImageUrl,
      scheduledDate: scheduledDateObj,
    },
  );

  if (!wpResult.success || !wpResult.postId || !wpResult.postUrl) {
    throw new ExternalServiceError("WordPress", new Error(wpResult.error || "Failed to publish"));
  }

  await prisma.article.update({
    where: { id: articleId },
    data: { wordPressPostId: wpResult.postId, wordPressSiteId: wordPressSiteId, publishedUrl: wpResult.postUrl },
  });

  await invalidateArticleCache(articleId, uid);
  logger.info("Article published to WordPress", { articleId, userId: uid, wpSiteId: wordPressSiteId, wpPostId: wpResult.postId });

  return NextResponse.json({ success: true, postId: wpResult.postId, postUrl: wpResult.postUrl, retryCount: wpResult.retryCount ?? 0 });
}

export const POST = withRateLimit(withErrorHandler(publishHandler), "wordpress");
