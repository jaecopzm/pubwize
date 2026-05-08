import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OptimizationData } from "@/lib/types";
import { optimizeDraft, getInternalLinkSuggestions, getQualityMetricsWithOpenRouter } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const draft = article.draft as any;
    if (!draft?.content) return NextResponse.json({ error: "Article has no draft" }, { status: 400 });
    if (!article.keyword) return NextResponse.json({ error: "Article missing keyword" }, { status: 400 });

    const optimization: OptimizationData = await optimizeDraft({ keyword: article.keyword, content: draft.content });

    try {
      const otherArticles = await prisma.article.findMany({
        where: { siteId: article.siteId, ownerId: uid, status: "optimized", NOT: { id: articleId } },
        select: { id: true, keyword: true, publishedUrl: true },
        take: 15,
      });

      const [internalLinks, qualityMetrics] = await Promise.all([
        getInternalLinkSuggestions({ currentContent: draft.content, otherArticles: otherArticles.map((a) => ({ id: a.id, title: a.keyword || "Untitled", publishedUrl: a.publishedUrl || null })) }),
        getQualityMetricsWithOpenRouter({ content: draft.content }),
      ]);

      optimization.internalLinks = internalLinks;
      optimization.aiDetection = { score: qualityMetrics.score, riskLevel: qualityMetrics.riskLevel };
    } catch {}

    await prisma.article.update({ where: { id: articleId }, data: { optimizations: optimization as any, status: "optimized" } });

    return NextResponse.json({ articleId, optimization });
  } catch (error) {
    console.error("Error in /api/articles/optimize", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
