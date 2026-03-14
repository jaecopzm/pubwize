import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  BriefData,
  OutlineData,
  DraftData,
  OptimizationData,
} from "./types";
import type { SerpContext } from "./serper";

// Use a lightweight, fast model for development.
const MODEL_NAME = "gemini-2.5-flash-lite";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateBriefWithGemini(params: {
  keyword: string;
  siteContext: {
    niche?: string;
    targetCountry?: string;
    language?: string;
    brandVoice?: {
      adjectives?: string[];
      tone?: string;
      targetAudience?: string;
      formattingRules?: string;
    };
  };
  serpContext?: SerpContext;
}): Promise<BriefData> {
  // Use the new unified AI system with fallback
  const { generateBrief } = await import("./ai-providers");
  return generateBrief(params);
}

export async function generateOutlineWithGemini(params: {
  brief: BriefData;
  keyword: string;
}): Promise<OutlineData> {
  // Use the new unified AI system with fallback
  const { generateOutline } = await import("./ai-providers");
  return generateOutline(params);
}

export async function generateDraftWithGemini(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
}): Promise<DraftData> {
  // Use the new unified AI system with fallback
  const { generateDraft } = await import("./ai-providers");
  return generateDraft(params);
}

/**
 * Streaming version — yields text chunks as they arrive from Gemini.
 * Callers should pass the chunks directly to a ReadableStream for SSE.
 */
export async function* generateDraftStream(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
}): AsyncGenerator<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const systemPrompt = `
You are a professional SEO content writer specializing in creating engaging, well-structured articles that are easy to read and rank well.

CRITICAL FORMATTING RULES:
1. Use proper Markdown heading hierarchy:
   - # for the main title (H1) - use ONCE at the top, MUST include the target keyword
   - ## for major sections (H2) - include keyword variations in 2-3 headings
   - ### for subsections (H3)

2. READABILITY & FORMATTING REQUIREMENTS (CRITICAL - AIM FOR 90+ FLESCH SCORE):
   - Keep sentences VERY SHORT (10-15 words maximum)
   - Use simple, everyday words - absolutely no jargon
   - Write at a 5th-grade reading level (highly accessible)
   - Use active voice ONLY
   - Short paragraphs: 1-3 sentences maximum
   - DO NOT LEAVE EXCESSIVE SPACING: Use exactly ONE blank line between headings and paragraphs. Do not output multiple consecutive empty lines.

3. KEYWORD OPTIMIZATION (CRITICAL):
   - Target keyword density: 1.5-2%
   - Include exact keyword in first paragraph, 2-3 H2 headings, and conclusion
   - Use keyword variations and synonyms

4. VISUALS (NEW):
   - Every 300-400 words, insert an image placeholder like: [IMAGE_SUGGESTION: descriptive search query]
   - Example position: [IMAGE_SUGGESTION: espresso machine extraction]

Return ONLY the article content as clean Markdown text (no JSON, no code blocks, no backticks).
`;

  const userPrompt = `
Target keyword: "${params.keyword}"
Tone: ${params.tone}
Target word count: ${params.targetWordCount ?? "2000-2500 words"}

Outline to follow:
${JSON.stringify(params.outline, null, 2)}

Write a complete, engaging article that is EASY TO READ and well-optimized for the keyword "${params.keyword}".
`;

  const streamResult = await model.generateContentStream(`${systemPrompt}\n\n${userPrompt}`);

  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export async function optimizeDraftWithGemini(params: {
  keyword: string;
  content: string;
}): Promise<OptimizationData> {
  // Use the new unified AI system with fallback
  const { optimizeDraft } = await import("./ai-providers");
  return optimizeDraft(params);
}

export async function getInternalLinkSuggestions(params: {
  currentContent: string;
  otherArticles: Array<{ id: string; title: string; publishedUrl?: string | null }>;
}): Promise<Array<{
  anchorText: string;
  targetArticleId: string;
  targetArticleTitle: string;
  targetArticleUrl: string;
  context: string;
}>> {
  if (params.otherArticles.length === 0) return [];

  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const systemPrompt = `
You are an SEO expert focused on smart internal linking.
Identify the best opportunities to link from the CURRENT article to the PROVIDED list of other articles.

Return JSON only with this shape (array of up to 3 suggestions):
[
  {
    "anchorText": string,
    "targetArticleId": string,
    "targetArticleTitle": string,
    "targetArticleUrl": string,
    "context": string        // The sentence or phrase in the current article where this link fits best
  }
]

Requirements:
- Only suggest links that are highly relevant.
- Max 3 suggestions.
- Ensure the anchorText exists or can naturally fit in the current content.
- Return ONLY valid JSON.
`;

  const userPrompt = `
CURRENT ARTICLE CONTENT (Excerpts):
${params.currentContent.slice(0, 5000)}

OTHER ARTICLES AVAILABLE ON THIS SITE:
${params.otherArticles.map(a => `- [ID: ${a.id}] ${a.title} (URL: ${a.publishedUrl ?? 'not published yet'})`).join("\n")}

Identify up to 3 best internal link opportunities.
`;

  const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
  let text = result.response.text().trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  try {
    const suggestions = JSON.parse(text);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch {
    console.error("Failed to parse internal link suggestions from Gemini");
    return [];
  }
}
export async function getQualityMetricsWithGemini(params: {
  content: string;
}): Promise<{
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  engagementScore: number;
  humanLikeScore: number;
}> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  const systemPrompt = `
You are a content quality auditor. Analyze the provided article for depth, engagement, and AI-like patterns.

Return JSON only with this shape:
{
  "engagementScore": number,  // 0-100
  "humanLikeScore": number,   // 0-100 (higher means more natural variance)
  "uniquenessScore": number,  // 0-100
  "riskLevel": "low" | "medium" | "high" 
}

"humanLikeScore" should be low if the content is repetitive, overly structured, or lacks personal voice.
"engagementScore" should be high if the content is actionable, uses examples, and flows logically.
`;

  const userPrompt = `
Analyze this article content:
${params.content.slice(0, 8000)}

Return the quality audit as valid JSON.
`;

  const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
  let text = result.response.text().trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  try {
    const audit = JSON.parse(text);
    const score = Math.round((audit.engagementScore + audit.humanLikeScore + audit.uniquenessScore) / 3);
    return {
      score,
      riskLevel: audit.riskLevel || 'low',
      engagementScore: audit.engagementScore || 0,
      humanLikeScore: audit.humanLikeScore || 0
    };
  } catch {
    return { score: 70, riskLevel: 'low', engagementScore: 70, humanLikeScore: 70 };
  }
}
