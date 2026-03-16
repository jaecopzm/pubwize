import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiUserContext, logAIUsage } from "@/lib/ai-providers";

const MODEL_NAME = "gemini-2.5-flash-lite";

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    return new GoogleGenerativeAI(apiKey);
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decodedToken = await adminAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { articleId } = await req.json();
        if (!articleId) {
            return NextResponse.json({ error: "articleId is required" }, { status: 400 });
        }

        const db = adminDb();
        const articleSnap = await db.collection("articles").doc(articleId).get();

        if (!articleSnap.exists) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        const articleData = articleSnap.data() as {
            ownerId?: string;
            draft?: { content?: string };
            keyword?: string;
        };

        if (articleData.ownerId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const draftContent = articleData.draft?.content;
        if (!draftContent) {
            return NextResponse.json({ error: "Article has no draft content to repurpose." }, { status: 400 });
        }

        const keyword = articleData.keyword || "the topic";

        const client = getGeminiClient();
        const model = client.getGenerativeModel({ model: MODEL_NAME });

        const systemPrompt = `You are a social media expert. Given an article, generate repurposed content for three channels.

Return a JSON object with this EXACT shape:
{
  "twitterThread": string[],
  "linkedinPost": string,
  "emailNewsletter": string
}

Rules:
- "twitterThread": An array of 5-7 strings, each under 280 characters. Use hooks, emojis, and line breaks for readability. Start with a powerful hook tweet.
- "linkedinPost": A single 600-1000 character LinkedIn post. Professional tone, end with a question to drive comments.
- "emailNewsletter": A short 150-200 word email snippet (not the full email). Should be warm and act as a teaser to drive clicks to the full article.

Return VALID JSON ONLY. No prose, no markdown fences.`;

        const userPrompt = `Article about: "${keyword}"

Here is the full article to repurpose:
---
${draftContent.slice(0, 6000)}
---

Generate the 3 social media assets now.`;

        const result = await aiUserContext.run(userId, () =>
          model.generateContent(`${systemPrompt}\n\n${userPrompt}`)
        );
        logAIUsage(userId, { provider: "gemini", model: MODEL_NAME, taskType: "repurpose" });
        let text = result.response.text().trim();

        if (text.startsWith("```")) {
            text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
        }

        let socialAssets;
        try {
            socialAssets = JSON.parse(text);
        } catch {
            return NextResponse.json({ error: "AI returned malformed response. Please try again." }, { status: 500 });
        }

        // Save to Firestore
        await db.collection("articles").doc(articleId).update({
            socialAssets,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true, socialAssets });
    } catch (error) {
        console.error("Error in repurpose endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
