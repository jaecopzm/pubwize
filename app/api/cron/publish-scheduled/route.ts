import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { invalidateBlogCache } from "@/lib/blog-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find articles scheduled for publishing that haven't been published yet
  const due = await prisma.article.findMany({
    where: {
      scheduledDate: { lte: new Date() },
      blogPublishedAt: null,
      blogSlug: null,
      draft: { not: null },
    },
    select: { id: true, keyword: true, metaTitle: true, articleType: true },
  });

  if (due.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let published = 0;
  for (const article of due) {
    let blogSlug = slugify(article.metaTitle || article.keyword);
    const existing = await prisma.article.findUnique({ where: { blogSlug } });
    if (existing) blogSlug = `${blogSlug}-${Date.now().toString(36).slice(-4)}`;

    await prisma.article.update({
      where: { id: article.id },
      data: {
        blogSlug,
        blogPublishedAt: new Date(),
        blogTags: article.articleType?.toLowerCase() || null,
      },
    });
    published++;
  }

  if (published > 0) await invalidateBlogCache();

  return NextResponse.json({ published });
}
