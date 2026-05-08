import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { siteId } = await req.json();
    if (!siteId) return NextResponse.json({ error: "Missing siteId" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user?.planTier !== "pro") {
      return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site || site.ownerId !== uid) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const existingArticles = await prisma.article.findMany({
      where: { siteId, ownerId: uid },
      select: { keyword: true },
      take: 10,
    });

    const existingTopics = existingArticles.map((a) => a.keyword);

    const prompt = `You are an SEO content strategist. Based on the following information, suggest ONE specific, actionable article topic.

Site Niche: ${site.niche}
Target Country: ${(site as any).targetCountry || "Global"}
Existing Topics: ${existingTopics.length > 0 ? existingTopics.join(", ") : "None yet"}

Requirements: relevant to niche, not duplicate, trending or evergreen, specific, under 60 characters.
Return ONLY the topic title, nothing else.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const cleanTopic = result.response.text().trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({ topic: cleanTopic });
  } catch (error) {
    console.error("Topic suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}
