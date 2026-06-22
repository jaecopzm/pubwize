import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiUserContext, logAIUsage } from "@/lib/ai-providers";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { asDraft, asOptimizations } from "@/lib/prisma-json";

const MODEL_NAME = "gemini-2.5-flash-lite";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: "articleId is required" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const draft = asDraft(article.draft);
    if (!draft?.content) return NextResponse.json({ error: "Article has no draft content to repurpose." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a social media expert. Given an article, generate repurposed content.

Return JSON with this EXACT shape:
{"twitterThread":string[],"linkedinPost":string,"emailNewsletter":string}

Rules: twitterThread = 5-7 tweets under 280 chars each, linkedinPost = 600-1000 chars professional, emailNewsletter = 150-200 word teaser. Return VALID JSON ONLY.

Article about: "${article.keyword}"
---
${draft.content.slice(0, 6000)}`;

    const result = await aiUserContext.run(userId, () => model.generateContent(prompt));
    logAIUsage(userId, { provider: "gemini", model: MODEL_NAME, taskType: "repurpose" });

    let text = result.response.text().trim().replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    let socialAssets;
    try {
      socialAssets = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned malformed response. Please try again." }, { status: 500 });
    }

    await prisma.article.update({ where: { id: articleId }, data: { optimizations: { ...asOptimizations(article.optimizations), socialAssets } as any } });
    await invalidateArticleCache(articleId, userId);
    return NextResponse.json({ success: true, socialAssets });
  } catch (error) {
    logger.error("Error in repurpose endpoint", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
