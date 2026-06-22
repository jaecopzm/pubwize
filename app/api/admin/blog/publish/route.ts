import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";
import { slugify } from "@/lib/slug";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { articleId, slug: customSlug } = await req.json();
  if (!articleId) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (article.blogPublishedAt) {
    return NextResponse.json({ error: "Already published to blog" }, { status: 409 });
  }

  let blogSlug = customSlug || slugify(article.keyword);

  // Ensure uniqueness
  const existing = await prisma.article.findUnique({ where: { blogSlug } });
  if (existing && existing.id !== articleId) {
    const suffix = Date.now().toString(36).slice(-4);
    blogSlug = `${blogSlug}-${suffix}`;
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { blogSlug, blogPublishedAt: new Date() },
  });

  return NextResponse.json({
    slug: blogSlug,
    publishedAt: updated.blogPublishedAt,
    url: `/blog/${blogSlug}`,
  });
});
