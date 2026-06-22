import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { generateSocialMedia, aiUserContext } from "@/lib/ai-providers";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { asDraft, asSettings, asOptimizations } from "@/lib/prisma-json";

export async function POST(request: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const usageCheck = await canPerformAction(uid, "socialGeneration");
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason || "Social media generation limit reached", upgradeRequired: true, current: usageCheck.current, limit: usageCheck.limit }, { status: 403 });
    }

    const { articleId } = await request.json();
    if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const draft = asDraft(article.draft);
    const settings = asSettings(article.settings);
    if (!draft?.content || !article.keyword) {
      return NextResponse.json({ error: "Article must have draft content and keyword" }, { status: 400 });
    }

    const socialMediaData = await aiUserContext.run(uid, () =>
      generateSocialMedia({ content: draft.content, keyword: article.keyword, tone: settings?.tone || "professional" })
    );

    await prisma.article.update({ where: { id: articleId }, data: { optimizations: { ...asOptimizations(article.optimizations), socialMedia: socialMediaData } as any } });
    await invalidateArticleCache(articleId, uid);
    await incrementUsage(uid, "socialGeneration");

    return NextResponse.json({ socialMedia: socialMediaData });
  } catch (error) {
    logger.error("Social media generation error", error);
    return NextResponse.json({ error: "Failed to generate social media content" }, { status: 500 });
  }
}
