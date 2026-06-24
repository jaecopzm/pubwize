import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const articles = await prisma.article.findMany({
    where: { blogPublishedAt: { not: null } },
    select: {
      id: true,
      keyword: true,
      metaTitle: true,
      metaDescription: true,
      blogSlug: true,
      blogTags: true,
      blogPublishedAt: true,
      featuredImage: true,
      views: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { displayName: true } },
      site: { select: { siteName: true } },
    },
    orderBy: { blogPublishedAt: "desc" },
  });

  const posts = articles.map((a) => ({
    id: a.id,
    _source: "db" as const,
    title: a.metaTitle || a.keyword,
    description: a.metaDescription || "",
    slug: a.blogSlug!,
    tags: a.blogTags ? a.blogTags.split(",").filter(Boolean) : [],
    coverImage: (a.featuredImage as { url?: string } | null)?.url,
    views: a.views,
    publishedAt: a.blogPublishedAt!.toISOString(),
    author: a.owner.displayName || "Pubwize Team",
    siteName: a.site.siteName,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json({ posts });
});
