import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { withRateLimit } from "@/lib/rate-limit";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { logger } from "@/lib/logger";
import { decryptPassword } from "@/lib/wordpress/encryption";

async function publishHandler(request: NextRequest) {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many publish requests." }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRequestBody(body, ["articleId", "wordPressSiteId", "title", "content"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId, wordPressSiteId, title, content, status = "draft", categories = [], tags = [], featuredImageUrl, scheduledDate } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article");
  assertValid(article.ownerId === uid, "You don't have permission to publish this article");

  const wpSite = await prisma.wordPressSite.findUnique({ where: { id: wordPressSiteId } });
  if (!wpSite) throw new NotFoundError("WordPress site");
  assertValid(wpSite.userId === uid, "You don't have permission to use this WordPress site");

  const { getCategories, getTags, createCategory } = await import("@/lib/wordpress/service");
  const wpSiteFormatted = { id: wordPressSiteId, siteUrl: wpSite.siteUrl, username: wpSite.username, encryptedPassword: wpSite.encryptedPassword } as any;

  const categoryIds: number[] = [];
  if (categories.length > 0) {
    const existingCategories = await getCategories(wpSiteFormatted);
    for (const name of categories) {
      const existing = existingCategories.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      categoryIds.push(existing ? existing.id : await createCategory(wpSiteFormatted, name));
    }
  }

  const tagIds: number[] = [];
  if (tags.length > 0) {
    const existingTags = await getTags(wpSiteFormatted);
    for (const name of tags) {
      const existing = existingTags.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
      if (existing) tagIds.push(existing.id);
    }
  }

  const postData: any = { title, content, status };
  if (categoryIds.length > 0) postData.categories = categoryIds;
  if (tagIds.length > 0) postData.tags = tagIds;
  if (status === "future" && scheduledDate) postData.date = scheduledDate;

  if (featuredImageUrl) {
    try {
      const { uploadFeaturedImage } = await import("@/lib/wordpress/service");
      const mediaId = await uploadFeaturedImage(wpSiteFormatted, featuredImageUrl, title);
      if (mediaId) postData.featured_media = mediaId;
    } catch {}
  }

  let wpPost;
  try {
    const decryptedPassword = decryptPassword(wpSite.encryptedPassword).replace(/\s+/g, "");
    const wpResponse = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${wpSite.username}:${decryptedPassword}`).toString("base64")}`,
      },
      body: JSON.stringify(postData),
    });

    if (!wpResponse.ok) throw new Error("Failed to publish to WordPress");
    wpPost = await wpResponse.json();
  } catch (wpError) {
    throw new ExternalServiceError("WordPress", wpError);
  }

  await prisma.article.update({
    where: { id: articleId },
    data: { wordPressPostId: wpPost.id, wordPressSiteId: wordPressSiteId, publishedUrl: wpPost.link },
  });

  await invalidateArticleCache(articleId, uid);
  logger.info("Article published to WordPress", { articleId, userId: uid, wpSiteId: wordPressSiteId, wpPostId: wpPost.id });

  return NextResponse.json({ success: true, postId: wpPost.id, postUrl: wpPost.link });
}

export const POST = withRateLimit(withErrorHandler(publishHandler), "wordpress");
