import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { articleId, title, description, tags, featuredImage } = await req.json();
  if (!articleId) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (!article.blogPublishedAt) {
    return NextResponse.json({ error: "Article is not published on the blog" }, { status: 409 });
  }

  // Normalize tags
  const blogTags = Array.isArray(tags)
    ? tags.filter(Boolean).map((t: string) => t.trim().toLowerCase()).join(",")
    : typeof tags === "string" && tags.trim()
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).join(",")
      : article.blogTags;

  let featuredImageJson = undefined;
  if (featuredImage !== undefined) {
    if (typeof featuredImage === "string") {
      featuredImageJson = featuredImage ? { url: featuredImage } : null;
    } else if (typeof featuredImage === "object") {
      featuredImageJson = featuredImage;
    }
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      ...(title !== undefined ? { metaTitle: title } : {}),
      ...(description !== undefined ? { metaDescription: description } : {}),
      ...(blogTags !== undefined ? { blogTags } : {}),
      ...(featuredImageJson !== undefined ? { featuredImage: featuredImageJson } : {}),
    },
  });

  try { const { invalidateBlogCache } = await import("@/lib/blog-cache"); await invalidateBlogCache(); } catch {}

  return NextResponse.json({ success: true, slug: updated.blogSlug, updatedAt: updated.updatedAt });
});
