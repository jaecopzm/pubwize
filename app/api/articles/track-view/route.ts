import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { asOptimizations } from "@/lib/prisma-json";

export async function POST(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== uid) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Track view in optimizations JSON field
    const opts = (asOptimizations(article.optimizations) || {}) as Record<string, unknown>;
    const views = ((opts.views as number) || 0) + 1;
    await prisma.article.update({ where: { id: articleId }, data: { optimizations: { ...opts, views, lastViewedAt: new Date().toISOString() } as any } });

    return NextResponse.json({ success: true, views });
  } catch (error) {
    logger.error("Track view error", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
