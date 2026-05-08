import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, assertValid, NotFoundError, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { withRateLimit } from "@/lib/rate-limit";
import { decryptPassword } from "@/lib/wordpress/encryption";

async function updateHandler(request: NextRequest) {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const body = await request.json();
  const validation = validateRequestBody(body, ["articleId", "siteId", "postId", "title", "content"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { siteId, postId, title, content, status = "publish", categories = [], tags = [] } = body;

  const wpSite = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
  if (!wpSite) throw new NotFoundError("WordPress site");
  assertValid(wpSite.userId === uid, "You don't have permission to use this WordPress site");

  const { getCategories, getTags, createCategory } = await import("@/lib/wordpress/service");
  const wpSiteFormatted = { id: siteId, siteUrl: wpSite.siteUrl, username: wpSite.username, encryptedPassword: wpSite.encryptedPassword } as any;

  const categoryIds: number[] = [];
  if (categories.length > 0) {
    const existing = await getCategories(wpSiteFormatted);
    for (const name of categories) {
      const found = existing.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      categoryIds.push(found ? found.id : await createCategory(wpSiteFormatted, name));
    }
  }

  const tagIds: number[] = [];
  if (tags.length > 0) {
    const existing = await getTags(wpSiteFormatted);
    for (const name of tags) {
      const found = existing.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
      if (found) tagIds.push(found.id);
    }
  }

  const postData: any = { title, content, status };
  if (categoryIds.length > 0) postData.categories = categoryIds;
  if (tagIds.length > 0) postData.tags = tagIds;

  try {
    const cleanPassword = decryptPassword(wpSite.encryptedPassword).replace(/\s+/g, "");
    const wpResponse = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${wpSite.username}:${cleanPassword}`).toString("base64")}` },
      body: JSON.stringify(postData),
    });

    if (!wpResponse.ok) throw new Error("Failed to update WordPress post");
    const wpPost = await wpResponse.json();
    return NextResponse.json({ success: true, postId: wpPost.id, postUrl: wpPost.link });
  } catch (wpError) {
    throw new ExternalServiceError("WordPress", wpError);
  }
}

export const POST = withRateLimit(withErrorHandler(updateHandler), "wordpress");
