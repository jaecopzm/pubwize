import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { aiUserContext, logAIUsage } from "@/lib/ai-providers";

const MODEL_NAME = "gemini-2.5-flash-lite";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: uid } });
    const userPlan = user?.planTier || "free";

    if (userPlan === "free") {
      return NextResponse.json({ error: "Pillar & Cluster Strategy is available on Starter and Pro plans", upgradeRequired: true }, { status: 403 });
    }

    const usageCheck = await canPerformAction(null, uid, "researchQueries");
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason || "Research query limit reached", upgradeRequired: true, current: usageCheck.current, limit: usageCheck.limit }, { status: 403 });
    }

    const { seedTopic, niche } = await req.json();
    if (!seedTopic) return NextResponse.json({ error: "seedTopic is required" }, { status: 400 });

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are an expert SEO content strategist. Given a broad "Seed Topic", generate a complete Pillar & Cluster strategy.

Return a JSON object with this EXACT shape:
{"pillar":{"keyword":string,"description":string,"estimatedWordCount":number},"clusters":[{"keyword":string,"description":string,"estimatedWordCount":number}]}

Rules: pillar = broad comprehensive topic, clusters = 5-7 specific supporting articles, estimatedWordCount: pillar 3000-5000, clusters 1000-2000. Return VALID JSON ONLY.

Seed Topic: "${seedTopic}"${niche ? `\nNiche: "${niche}"` : ""}`;

    const result = await aiUserContext.run(uid, () => model.generateContent(prompt));
    logAIUsage(uid, { provider: "gemini", model: MODEL_NAME, taskType: "cluster" });

    let text = result.response.text().trim().replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();

    let strategy;
    try {
      strategy = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned malformed strategy. Please try again." }, { status: 500 });
    }

    await incrementUsage(null, uid, "researchQueries");
    return NextResponse.json({ success: true, strategy });
  } catch (error) {
    console.error("Error generating cluster strategy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
