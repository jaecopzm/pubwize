import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";

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
        const decoded = await adminAuth().verifyIdToken(token);
        const uid = decoded.uid;

        // Check usage limits
        const db = adminDb();
        
        // First check if user has access to cluster strategy (Starter+ only)
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();
        const userData = userSnap.data();
        const userPlan = userData?.planTier || userData?.plan || 'free';
        
        if (userPlan === 'free') {
            return NextResponse.json(
                { 
                    error: "Pillar & Cluster Strategy is available on Starter and Pro plans",
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }
        
        const usageCheck = await canPerformAction(db, uid, 'researchQueries');
        
        if (!usageCheck.allowed) {
            return NextResponse.json(
                { 
                    error: usageCheck.reason || "Research query limit reached",
                    upgradeRequired: true,
                    current: usageCheck.current,
                    limit: usageCheck.limit
                },
                { status: 403 }
            );
        }

        const { seedTopic, niche } = await req.json();
        if (!seedTopic) {
            return NextResponse.json({ error: "seedTopic is required" }, { status: 400 });
        }

        const client = getGeminiClient();
        const model = client.getGenerativeModel({ model: MODEL_NAME });

        const systemPrompt = `You are an expert SEO content strategist specializing in topic cluster planning.
Given a broad "Seed Topic", generate a complete Pillar & Cluster strategy that will help a website dominate search rankings for this niche.

Return a JSON object with this EXACT shape:
{
  "pillar": {
    "keyword": string,
    "description": string,
    "estimatedWordCount": number
  },
  "clusters": [
    {
      "keyword": string,
      "description": string,
      "estimatedWordCount": number
    }
  ]
}

Rules:
- "pillar" must be the BROAD, comprehensive topic (e.g., "Complete Guide to Dog Training")
- "clusters" must be 5-7 SPECIFIC, supporting articles that link back to the pillar
- Each keyword should be a full article title suitable as a target keyword
- estimatedWordCount: pillar = 3000-5000, clusters = 1000-2000
- Return VALID JSON ONLY. No markdown fences, no prose.`;

        const userPrompt = `Seed Topic: "${seedTopic}"
${niche ? `Niche: "${niche}"` : ""}

Generate a complete Pillar & Cluster content strategy.`;

        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        let text = result.response.text().trim();

        if (text.startsWith("```")) {
            text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
        }

        let strategy;
        try {
            strategy = JSON.parse(text);
        } catch {
            return NextResponse.json({ error: "AI returned malformed strategy. Please try again." }, { status: 500 });
        }

        // Increment usage counter
        await incrementUsage(db, uid, 'researchQueries');

        return NextResponse.json({ success: true, strategy });
    } catch (error) {
        console.error("Error generating cluster strategy:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
