import { GoogleGenerativeAI } from "@google/generative-ai";
import { AsyncLocalStorage } from "async_hooks";
import type { BriefData, OutlineData, DraftData, OptimizationData, SocialMediaData, SiteBrandVoice } from "./types";
import type { SerpContext } from "./serper";

// Carries the current userId through async AI call chains without changing every function signature
export const aiUserContext = new AsyncLocalStorage<string>();

export async function logAIUsage(userId: string, data: {
  provider: string;
  model: string;
  taskType: string;
}) {
  try {
    const { adminDb } = await import("./firebase-admin");
    await adminDb().collection("aiUsageLogs").add({
      userId,
      ...data,
      ts: new Date(),
    });
  } catch {
    // non-critical, never throw
  }
}

// Provider configuration
export type AIProvider = 'gemini' | 'openrouter' | 'groq';

interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  userId?: string; // for usage logging
  temperature?: number;
  maxTokens?: number;
  expectJSON?: boolean;
  taskType?: 'brief' | 'outline' | 'draft' | 'optimize' | 'social' | 'quick';
  useBulkModel?: boolean; // Use faster model for bulk operations
}

interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  cached?: boolean;
}

// Model configurations for each provider
const MODELS = {
  gemini: {
    fast: "gemini-2.5-flash-lite",
    json: "gemini-2.5-flash-lite",
    draft: "gemini-2.5-flash"
  },
  openrouter: {
    fast: "nvidia/nemotron-3-nano-30b-a3b:free",
    json: "nvidia/nemotron-3-nano-30b-a3b:free",
    draft: "arcee-ai/trinity-large-preview:free"
  },
  groq: {
    fast: "llama-3.3-70b-versatile",
    json: "llama-3.1-8b-instant",
    draft: "gpt-oss-120b", // Slower but better quality for single articles
    draftBulk: "llama-3.3-70b-versatile" // Faster for bulk generation
  }
};

// Task-specific provider preferences
const TASK_PROVIDERS = {
  brief: ['groq', 'openrouter', 'gemini'] as AIProvider[], // Groq first for speed in bulk generation
  outline: ['groq', 'openrouter', 'gemini'] as AIProvider[],
  draft: ['groq', 'openrouter', 'gemini'] as AIProvider[],
  optimize: ['gemini', 'openrouter', 'groq'] as AIProvider[],
  social: ['groq', 'openrouter', 'gemini'] as AIProvider[], // Groq first for JSON reliability
  quick: ['groq', 'gemini', 'openrouter'] as AIProvider[]
};

// Default fallback order
const DEFAULT_PRIORITY: AIProvider[] = ['groq', 'openrouter', 'gemini'];

// Rate limits per provider (requests per minute)
const RATE_LIMITS = {
  gemini: 15,
  openrouter: 20,
  groq: 30
};

// Simple in-memory cache and rate limiting
const cache = new Map<string, { content: string; timestamp: number; provider: AIProvider; model: string }>();
const rateLimitMap = new Map<string, number[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getCacheKey(request: AIRequest): string {
  return Buffer.from(JSON.stringify({
    system: request.systemPrompt.slice(0, 100),
    user: request.userPrompt.slice(0, 100),
    temp: request.temperature,
    json: request.expectJSON
  })).toString('base64');
}

function checkRateLimit(provider: AIProvider): boolean {
  const now = Date.now();
  const key = provider;
  const requests = rateLimitMap.get(key) || [];

  // Clean old requests
  const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recent.length >= RATE_LIMITS[provider]) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

function getFromCache(key: string): AIResponse | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return {
    content: cached.content,
    provider: cached.provider,
    model: cached.model,
    cached: true
  };
}

function setCache(key: string, response: AIResponse): void {
  cache.set(key, {
    content: response.content,
    timestamp: Date.now(),
    provider: response.provider,
    model: response.model
  });
}

// Provider implementations
async function callGemini(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenerativeAI(apiKey);
  const modelName = request.expectJSON ? MODELS.gemini.json : MODELS.gemini.draft;
  const model = client.getGenerativeModel({ model: modelName });

  const prompt = `${request.systemPrompt}\n\n${request.userPrompt}`;
  const result = await model.generateContent(prompt);
  let content = result.response.text().trim();

  // Clean up code fences
  if (content.startsWith("```")) {
    content = content.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  return {
    content,
    provider: 'gemini',
    model: modelName
  };
}

async function callOpenRouter(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const modelName = request.expectJSON ? MODELS.openrouter.json : MODELS.openrouter.draft;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
      "X-Title": "PubWize",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("No content from OpenRouter");

  // Clean up code fences
  if (content.startsWith("```")) {
    content = content.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  return {
    content,
    provider: 'openrouter',
    model: modelName
  };
}

async function callGroq(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  // Use bulk model for faster generation in bulk operations
  let modelName: string;
  if (request.expectJSON) {
    modelName = MODELS.groq.json;
  } else if (request.useBulkModel && request.taskType === 'draft') {
    modelName = MODELS.groq.draftBulk;
  } else {
    modelName = MODELS.groq.draft;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("No content from Groq");

  // Clean up code fences
  if (content.startsWith("```")) {
    content = content.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  return {
    content,
    provider: 'groq',
    model: modelName
  };
}

// Main AI function with task-specific provider selection
export async function generateAI(request: AIRequest): Promise<AIResponse> {
  const cacheKey = getCacheKey(request);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Get provider priority based on task type
  const providers = request.taskType ? TASK_PROVIDERS[request.taskType] : DEFAULT_PRIORITY;
  const errors: string[] = [];

  // Try each provider in task-specific order
  for (const provider of providers) {
    if (!checkRateLimit(provider)) {
      errors.push(`${provider}: rate limited`);
      continue;
    }

    try {
      let response: AIResponse;

      switch (provider) {
        case 'gemini':
          response = await callGemini(request);
          break;
        case 'openrouter':
          response = await callOpenRouter(request);
          break;
        case 'groq':
          response = await callGroq(request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Cache successful response
      setCache(cacheKey, response);

      // Log AI usage (fire-and-forget)
      const userId = request.userId ?? aiUserContext.getStore();
      if (userId) {
        logAIUsage(userId, {
          provider: response.provider,
          model: response.model,
          taskType: request.taskType ?? "unknown",
        }).catch(() => {});
      }

      return response;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${provider}: ${msg}`);
      console.warn(`AI provider ${provider} failed for ${request.taskType || 'unknown'} task:`, msg);
    }
  }

  throw new Error(`All AI providers failed for ${request.taskType || 'unknown'} task: ${errors.join('; ')}`);
}

// Convenience functions for JSON responses
export async function generateAIJSON<T = unknown>(request: Omit<AIRequest, 'expectJSON'>): Promise<T> {
  const response = await generateAI({ ...request, expectJSON: true });

  try {
    // Clean response content - remove markdown code blocks if present
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Extract JSON object if there's text after it
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }
    
    return JSON.parse(cleanContent) as T;
  } catch (error) {
    console.error(`Failed to parse JSON from ${response.provider}:`, response.content);
    throw new Error(`Failed to parse JSON from ${response.provider}: ${error}`);
  }
}

// High-level functions for specific tasks
export async function generateBrief(params: {
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
  const { keyword, siteContext, serpContext } = params;

  const systemPrompt = `You are a senior SEO strategist. Create a brief that beats the competition by focusing on Topical Authority, EEAT, and Information Gain.

CRITICAL REQUIREMENTS:
- Generate 8-12 headings (H1 and H2 level) for comprehensive coverage
- Each heading should target a specific subtopic or question
- Mix of informational, how-to, and comparison headings
- Ensure headings cover the full topic depth

Return JSON with this exact shape:
{
  "intent": "Informational" | "Transactional" | "Navigational" | "Commercial Investigation",
  "articleType": string,
  "headings": string[],
  "questions": string[],
  "entities": string[],
  "internalLinkIdeas": string[],
  "externalLinkIdeas": string[],
  "competitorInsights": {
    "commonTopics": string[],
    "headingPatterns": string[],
    "contentGaps": string[],
    "sentiment": string
  },
  "informationGain": string[],
  "eeatOpportunities": string[]
}

"headings" MUST contain 8-12 items for proper article structure.
"informationGain" should list unique points or perspectives not found in the SERP data.
"eeatOpportunities" should suggest how to demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness for this topic.

Response must be valid JSON only.`;

  const serpBlock = serpContext ? `
SERP DATA:
${serpContext.topResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n")}

People Also Ask:
${serpContext.peopleAlsoAsk.map(q => `- ${q.question}`).join("\n")}
` : "";

  const userPrompt = `Target keyword: "${keyword}"

Site context:
- Niche: ${siteContext.niche ?? "unspecified"}
- Country: ${siteContext.targetCountry ?? "global"}
- Language: ${siteContext.language ?? "en"}
- Voice: ${siteContext.brandVoice?.adjectives?.join(", ") ?? "neutral"}
- Tone: ${siteContext.brandVoice?.tone ?? "professional"}
- Audience: ${siteContext.brandVoice?.targetAudience ?? "general"}
${serpBlock}
Create the best SEO brief for this keyword.`;

  return generateAIJSON<BriefData>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 4000,
    taskType: 'brief'
  });
}

export async function generateOutline(params: { brief: BriefData; keyword: string }): Promise<OutlineData> {
  const systemPrompt = `You are an SEO content strategist. Create a detailed outline optimized for Topical Authority and Featured Snippets.

CRITICAL REQUIREMENT:
- The FIRST section (H1) MUST be the article's title.
- The title MUST contain the target keyword: "${params.keyword}".

Return JSON with this shape:
{
  "sections": [
    {
      "heading": string,
      "level": 2 | 3,
      "notes": string,
      "answerTarget": string | null,
      "isFaq": boolean
    }
  ],
  "structuralLogic": string
}

"answerTarget" should be a concise 40-60 word answer for a potential Featured Snippet if applicable to that section.
"structuralLogic" explains why this hierarchy satisfies the user intent.

Response must be valid JSON only.`;

  const userPrompt = `Target Keyword: "${params.keyword}"
Brief: ${JSON.stringify(params.brief, null, 2)}

Create a clear, logical outline. Ensure the H1 title is included as the first section and contains the keyword.`;

  return generateAIJSON<OutlineData>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 3000,
    taskType: 'outline'
  });
}

export async function generateDraft(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
  lsiKeywords?: string[];
  siteBrandVoice?: (SiteBrandVoice & { expertPersona?: string }) | null;
}): Promise<DraftData> {
  const brandVoice = params.siteBrandVoice ? `
BRAND VOICE:
- Adjectives: ${params.siteBrandVoice.adjectives?.join(", ") || "none"}
- Tone: ${params.siteBrandVoice.tone || "professional"}
- Audience: ${params.siteBrandVoice.targetAudience || "general"}
- Rules: ${params.siteBrandVoice.formattingRules || "none"}
` : "";

  // Increase default to 2500 words for better content depth
  const targetWords = params.targetWordCount || 2500;
  const personaPrompt = params.siteBrandVoice?.expertPersona
    ? `\nEXPERT PERSONA: You are writing as a ${params.siteBrandVoice.expertPersona}. Use the specific expertise, terminology, and lived experience that comes with this role to add authority and unique insights.`
    : "";

  // Set minimum tokens to force longer content - 2 tokens per word to ensure we hit target
  const minTokens = Math.ceil(targetWords * 1.8);
  const draftMaxTokens = Math.min(Math.ceil(targetWords * 2.2), 8000);

  const systemPrompt = `You are a professional SEO content writer specializing in high-authority articles that demonstrate EEAT (Experience, Expertise, Authoritativeness, Trustworthiness).

Your goal is to write content that feels human, expert-led, and provides significant "Information Gain" beyond what currently exists in the SERPs.${personaPrompt}

🚨 CRITICAL WORD COUNT RULES - ABSOLUTE REQUIREMENTS:
- TARGET: ${targetWords} words - THIS IS NOT OPTIONAL
- MINIMUM: ${Math.floor(targetWords * 0.95)} words - YOU MUST WRITE AT LEAST THIS MUCH
- MAXIMUM: ${Math.ceil(targetWords * 1.05)} words
- Each section needs ~${Math.floor(targetWords / params.outline.sections.length)} words (${params.outline.sections.length} sections total)
- Write COMPLETE sections with depth and examples - don't cut corners
- If you're under ${Math.floor(targetWords * 0.95)} words, ADD MORE DETAIL to existing sections
- NEVER exceed the maximum

CONTENT STRUCTURE & WRITING STYLE:
1. Use proper Markdown hierarchy (# for H1, ## for H2, ### for H3).
2. Write for readability: Use short paragraphs (2-3 sentences), bold key terms sparingly, and use bulleted/numbered lists for steps.
3. Natural Language Flow: Vary sentence length. Mix simple and compound sentences.
4. AVOID AI CLICHES: Do NOT use phrases like "In today's digital landscape," "In conclusion," "Moreover," "Furthermore," "Firstly/Secondly," or "Crucial to note."
5. EEAT Implementation: Use an authoritative yet accessible voice.
6. Featured Snippet Optimization: Ensure direct answers to questions are concise (40-60 words) and placed prominently.
7. CRITICAL FORMATTING: Use exactly ONE blank line between paragraphs and sections. NEVER use multiple consecutive blank lines.

CRITICAL KEYWORD REQUIREMENTS:
- Target keyword: "${params.keyword}"
- MUST appear in: H1 title, at least 2-3 subheadings
- Target density: 1-1.5% (for ${targetWords} words = ${Math.round(targetWords * 0.01)}-${Math.round(targetWords * 0.015)} occurrences)
- Distribute naturally throughout the article
- NEVER keyword stuff

LSI KEYWORD INTEGRATION (MANDATORY):
${(params.lsiKeywords && params.lsiKeywords.length > 0) ? `Incorporate these semantic keywords naturally throughout: ${params.lsiKeywords.join(', ')}\n- Use at least 70% of these LSI keywords\n- Integrate them in headings, body text, and examples` : 'No LSI keywords provided'}

CONTENT DEPTH & SEO:
- FIRST PARAGRAPH RULE: DO NOT include the target keyword "${params.keyword}" in the first paragraph. Start with a hook, context, or problem statement instead.
- Include key entities from the brief: ${params.outline.sections.slice(0, 5).map(s => s.heading).join(", ")}
- Don't just state facts; explain the "why" and "how."
- Include one concrete example or analogy per major section — not multiple.

Return ONLY the article content as clean Markdown.${brandVoice}`;

  const userPrompt = `Target keyword: "${params.keyword}"
Tone: ${params.tone}

🚨 WORD COUNT ENFORCEMENT:
- Target: ${targetWords} words
- Minimum: ${Math.floor(targetWords * 0.95)} words
- Maximum: ${Math.ceil(targetWords * 1.05)} words
- Per section budget: ~${Math.floor(targetWords / params.outline.sections.length)} words
- STOP WRITING if you reach ${Math.ceil(targetWords * 1.05)} words

Outline: ${JSON.stringify(params.outline, null, 2)}

MANDATORY EXECUTION STEPS:
1. Write introduction (${Math.floor(targetWords * 0.1)} words) - NO keyword in first paragraph
2. For EACH section in outline, write ${Math.floor(targetWords / params.outline.sections.length)} words with:
   - Clear explanation of the topic
   - 1-2 concrete examples
   - Actionable insights
3. Write conclusion (${Math.floor(targetWords * 0.08)} words)
4. VERIFY you've written AT LEAST ${Math.floor(targetWords * 0.95)} words before finishing

CRITICAL: Each section MUST be ${Math.floor(targetWords / params.outline.sections.length)} words. Do NOT write short sections.

Include LSI keywords: ${params.lsiKeywords?.join(', ') || 'none'}

Write the complete ${targetWords}-word article now.`;

  const response = await generateAI({
    systemPrompt,
    userPrompt,
    temperature: 0.5, // Lower temperature for better instruction following
    maxTokens: draftMaxTokens,
    taskType: 'draft'
  });

  return {
    content: response.content,
    format: "markdown"
  };
}

export async function optimizeDraft(params: {
  keyword: string;
  content: string;
}): Promise<OptimizationData> {
  const systemPrompt = `You are an elite SEO auditor. Your goal is to provide actionable, advanced optimization suggestions to help this content rank #1.

Analyze the content for:
1. Topical Completeness: Are there any missing subtopics?
2. Entity Density: Are there missing related NLP entities?
3. Snippet Opportunities: Can we better target a Featured Snippet?
4. Internal/External Linking: Where should we link for maximum authority?
5. User Experience: Is the formatting and flow optimal?

Return JSON with this shape:
{
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "suggestions": string[],
  "lsiKeywords": string[],
  "schemaSuggestions": string[],
  "internalLinkingNotes": string
}

CRITICAL META DESCRIPTION REQUIREMENTS:
- MUST be EXACTLY 155-160 characters (this is the optimal length for Google)
- MUST include the target keyword "${params.keyword}" naturally within the first 100 characters
- Should be compelling and include a call-to-action or value proposition
- Should accurately summarize the content value
- Use active voice and power words
- End with a period or question mark
- VERIFY: Count characters before finalizing. If it's 161+ characters, cut it down. If it's under 150, expand it.

"suggestions" should be high-level strategic improvements.
"lsiKeywords" should be semantic terms to include to improve topical authority.
"schemaSuggestions" should suggest specific Schema.org types (e.g., FAQ, HowTo, Product).

Response must be valid JSON only.`;

  const userPrompt = `Target keyword: "${params.keyword}"

Content: ${params.content}

Provide optimization suggestions. Remember: Meta description MUST include "${params.keyword}" and be EXACTLY 155-160 characters (count carefully).`;

  return generateAIJSON<OptimizationData>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 2000,
    taskType: 'optimize'
  });
}

export async function generateSchema(params: {
  content: string;
  keyword: string;
  metadata: {
    title: string;
    description: string;
    url?: string;
    authorName?: string;
  }
}): Promise<string> {
  const systemPrompt = `You are a technical SEO specialist. Generate valid JSON-LD schema markup for the provided content.
Identify and generate blocks for:
1. Article (Primary)
2. FAQPage (if questions/answers exist)
3. HowTo (if step-by-step instructions exist)

Return ONLY the raw JSON-LD blocks within <script type="application/ld+json"> tags. Do not add any other text.`;

  const userPrompt = `Content: ${params.content.slice(0, 8000)}
Keyword: ${params.keyword}
Title: ${params.metadata.title}
Description: ${params.metadata.description}
URL: ${params.metadata.url || ''}
Author: ${params.metadata.authorName || 'PubWize Author'}`;

  const response = await generateAI({
    systemPrompt,
    userPrompt,
    temperature: 0.1,
    maxTokens: 3000,
    taskType: 'optimize'
  });

  return response.content;
}

export async function humanizeDraft(params: {
  content: string;
  keyword: string;
  expertPersona?: string;
}): Promise<string> {
  const personaBlock = params.expertPersona ? `Expert Persona: "${params.expertPersona}"` : "";

  const systemPrompt = `You are an elite developmental editor. Your job is to perform a final "Humanizer" pass on an AI-generated draft to ensure it feels authentic, authoritative, and expert-led.

RULES:
1. ELIMINATE AI-ISMS: Remove phrases like "In conclusion," "Moreover," "Digital landscape," "It's important to remember," etc.
2. VARY SENTENCE STRUCTURE: Ensure a mix of short, punchy sentences and longer, nuanced ones.
3. INJECT PERSONALITY: ${personaBlock ? `Write from the perspective of: ${params.expertPersona}. Use specialized jargon and professional context where appropriate.` : "Use a confident, expert voice."}
4. MAINTAIN FORMATTING: Keep all Markdown headers, lists, and bolding intact.
5. NO FLUFF: Ensure every sentence adds value.

Return ONLY the humanized Markdown content.`;

  const userPrompt = `Target Keyword: ${params.keyword}
Draft Content:
${params.content}`;

  const response = await generateAI({
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxTokens: 12000,
    taskType: 'draft'
  });

  return response.content;
}

// Export provider status for debugging
export function getProviderStatus() {
  const now = Date.now();
  return DEFAULT_PRIORITY.map(provider => {
    const requests = rateLimitMap.get(provider) || [];
    const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    return {
      provider,
      available: recent.length < RATE_LIMITS[provider],
      requestsInWindow: recent.length,
      limit: RATE_LIMITS[provider]
    };
  });
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

  const systemPrompt = `You are an SEO expert focused on smart internal linking.
Identify the best opportunities to link from the CURRENT article to the PROVIDED list of other articles.

Return JSON only with this shape (array of up to 3 suggestions):
[
  {
    "anchorText": string,
    "targetArticleId": string,
    "targetArticleTitle": string,
    "targetArticleUrl": string,
    "context": string
  }
]

Requirements:
- Only suggest links that are highly relevant.
- Max 3 suggestions.
- Ensure the anchorText exists or can naturally fit in the current content.
- Return ONLY valid JSON.`;

  const userPrompt = `CURRENT ARTICLE CONTENT (Excerpts):
${params.currentContent.slice(0, 5000)}

OTHER ARTICLES AVAILABLE ON THIS SITE:
${params.otherArticles.map((a) => `- [ID: ${a.id}] ${a.title} (URL: ${a.publishedUrl ?? "not published yet"})`).join("\n")}

Identify up to 3 best internal link opportunities.`;

  try {
    return await generateAIJSON<Array<{
      anchorText: string;
      targetArticleId: string;
      targetArticleTitle: string;
      targetArticleUrl: string;
      context: string;
    }>>({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
      taskType: 'quick'
    });
  } catch (error) {
    console.error("Failed to generate internal link suggestions:", error);
    return [];
  }
}

export async function getQualityMetricsWithOpenRouter(params: {
  content: string;
}): Promise<{
  score: number;
  riskLevel: "low" | "medium" | "high";
  engagementScore: number;
  humanLikeScore: number;
}> {
  const systemPrompt = `You are a content quality auditor. Analyze the provided article for depth, engagement, and AI-like patterns.

Return JSON only with this shape:
{
  "engagementScore": number,
  "humanLikeScore": number,
  "uniquenessScore": number,
  "riskLevel": "low" | "medium" | "high"
}

"humanLikeScore" should be low if the content is repetitive, overly structured, or lacks personal voice.
"engagementScore" should be high if the content is actionable, uses examples, and flows logically.`;

  const userPrompt = `Analyze this article content:
${params.content.slice(0, 8000)}

Return the quality audit as valid JSON.`;

  try {
    const audit = await generateAIJSON<{
      engagementScore: number;
      humanLikeScore: number;
      uniquenessScore: number;
      riskLevel: "low" | "medium" | "high";
    }>({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
      taskType: 'quick'
    });

    const score = Math.round((audit.engagementScore + audit.humanLikeScore + audit.uniquenessScore) / 3);
    return {
      score,
      riskLevel: audit.riskLevel || 'low',
      engagementScore: audit.engagementScore || 0,
      humanLikeScore: audit.humanLikeScore || 0
    };
  } catch (error) {
    console.error("Failed to get quality metrics, returning defaults:", error);
    return { score: 70, riskLevel: 'low', engagementScore: 70, humanLikeScore: 70 };
  }
}

// Streaming AI generation with task-specific provider selection
export async function* generateAIStream(request: AIRequest): AsyncGenerator<string> {
  // Get provider priority based on task type
  const providers = request.taskType ? TASK_PROVIDERS[request.taskType] : DEFAULT_PRIORITY;

  for (const provider of providers) {
    if (!checkRateLimit(provider)) continue;

    try {
      switch (provider) {
        case 'groq':
          yield* streamGroq(request);
          return;
        case 'openrouter':
          yield* streamOpenRouter(request);
          return;
        case 'gemini':
          yield* streamGemini(request);
          return;
      }
    } catch (error) {
      console.warn(`Streaming provider ${provider} failed for ${request.taskType}:`, error);
      continue;
    }
  }

  throw new Error(`All streaming providers failed for ${request.taskType}`);
}

async function* streamGroq(request: AIRequest): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const modelName = request.expectJSON ? MODELS.groq.json : MODELS.groq.draft;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 8000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq streaming error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Skip malformed chunk
      }
    }
  }
}

async function* streamOpenRouter(request: AIRequest): AsyncGenerator<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const modelName = request.expectJSON ? MODELS.openrouter.json : MODELS.openrouter.draft;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
      "X-Title": "PubWize",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 8000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter streaming error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data.endsWith("[DONE]")) continue;

      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Skip malformed chunk
      }
    }
  }
}

async function* streamGemini(request: AIRequest): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODELS.gemini.draft });

  const prompt = `${request.systemPrompt}\n\n${request.userPrompt}`;
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// High-level streaming draft generation
export async function* generateDraftStream(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
  lsiKeywords?: string[];
  useBulkModel?: boolean; // Use faster model for bulk generation
  siteBrandVoice?: (SiteBrandVoice & { expertPersona?: string }) | null;
  internalLinkArticles?: Array<{ keyword: string; publishedUrl?: string | null }> | null;
}): AsyncGenerator<string> {
  const brandVoice = params.siteBrandVoice ? `
BRAND VOICE:
- Adjectives: ${params.siteBrandVoice.adjectives?.join(", ") || "none"}
- Tone: ${params.siteBrandVoice.tone || "professional"}
- Audience: ${params.siteBrandVoice.targetAudience || "general"}
- Rules: ${params.siteBrandVoice.formattingRules || "none"}
` : "";

  // Increase default to 2500 words for better content depth
  const targetWords = params.targetWordCount || 2500;

  const personaPrompt = params.siteBrandVoice?.expertPersona
    ? `\nEXPERT PERSONA: You are writing as a ${params.siteBrandVoice.expertPersona}. Use the specific expertise, terminology, and lived experience that comes with this role to add authority and unique insights.`
    : "";

  // Set minimum tokens to force longer content - 2 tokens per word to ensure we hit target
  const minTokens = Math.ceil(targetWords * 1.8);
  const streamMaxTokens = Math.min(Math.ceil(targetWords * 2.2), 8000);

  const systemPrompt = `You are a professional SEO content writer specializing in high-authority articles that demonstrate EEAT (Experience, Expertise, Authoritativeness, Trustworthiness).

Your goal is to write content that feels human, expert-led, and provides significant "Information Gain" beyond what currently exists in the SERPs.${personaPrompt}

🚨 CRITICAL WORD COUNT RULES - ABSOLUTE REQUIREMENTS:
- TARGET: ${targetWords} words - THIS IS NOT OPTIONAL
- MINIMUM: ${Math.floor(targetWords * 0.95)} words - YOU MUST WRITE AT LEAST THIS MUCH
- MAXIMUM: ${Math.ceil(targetWords * 1.05)} words
- Each section needs ~${Math.floor(targetWords / params.outline.sections.length)} words (${params.outline.sections.length} sections total)
- Write COMPLETE sections with depth and examples - don't cut corners
- If you're under ${Math.floor(targetWords * 0.95)} words, ADD MORE DETAIL to existing sections
- NEVER exceed the maximum

CONTENT STRUCTURE & WRITING STYLE (CRITICAL FOR READABILITY):
1. Use proper Markdown hierarchy (# for H1, ## for H2, ### for H3).
2. EXTREME READABILITY (Target Flesch Reading Ease: 65-70):
   - Short sentences (average 12-15 words, max 20 words)
   - Simple vocabulary (8th-grade level)
   - Short paragraphs (2-3 sentences maximum)
   - Break up long blocks of text with subheadings or lists
3. Natural Language Flow: Vary sentence length but favor brevity. Mix simple and compound sentences.
4. AVOID AI CLICHES: Do NOT use phrases like "In today's digital landscape," "In conclusion," "Moreover," "Furthermore," "Firstly/Secondly," "Crucial to note," "It's important to note," "Delve into," or "Unlock."
5. EEAT Implementation: Use an authoritative yet accessible voice.
6. Featured Snippet Optimization: Ensure direct answers are concise (40-60 words) and placed prominently.
7. CRITICAL FORMATTING: Exactly ONE blank line between paragraphs. NEVER multiple consecutive blank lines.

CRITICAL KEYWORD REQUIREMENTS:
- Target keyword: "${params.keyword}"
- MUST appear in: H1 title, at least 2-3 subheadings
- Target density: 1-1.5% (${Math.round(targetWords * 0.01)}-${Math.round(targetWords * 0.015)} occurrences)
- Distribute naturally. NEVER keyword stuff.

LSI KEYWORD INTEGRATION (MANDATORY):
${(params.lsiKeywords && params.lsiKeywords.length > 0) ? `Incorporate these semantic keywords naturally throughout: ${params.lsiKeywords.join(', ')}\n- Use at least 70% of these LSI keywords in headings, body text, and examples` : 'No LSI keywords provided'}

CONTENT DEPTH & SEO:
- FIRST PARAGRAPH RULE: DO NOT include the target keyword "${params.keyword}" in the first paragraph. Start with a hook or context instead.
- Include key entities: ${params.outline.sections.slice(0, 5).map(s => s.heading).join(", ")}
- Don't just state facts; explain the "why" and "how."
- Include one concrete example or analogy per major section — not multiple.
- Do NOT repeat information covered in earlier sections.

Return ONLY the article content as clean Markdown.${brandVoice}`;

  const internalLinksBlock = (params.internalLinkArticles && params.internalLinkArticles.length > 0)
    ? '\n\nINTERNAL LINK OPPORTUNITIES:\n' +
    params.internalLinkArticles
      .filter(a => a.publishedUrl)
      .map(a => `- "${a.keyword}" -> ${a.publishedUrl}`)
      .join('\n')
    : '';

  const userPrompt = `Target keyword: "${params.keyword}"
Tone: ${params.tone}

🚨 WORD COUNT ENFORCEMENT:
- Target: ${targetWords} words
- Minimum: ${Math.floor(targetWords * 0.95)} words
- Maximum: ${Math.ceil(targetWords * 1.05)} words
- Per section budget: ~${Math.floor(targetWords / params.outline.sections.length)} words
- STOP WRITING if you reach ${Math.ceil(targetWords * 1.05)} words

Outline: ${JSON.stringify(params.outline, null, 2)}
${internalLinksBlock}

MANDATORY EXECUTION STEPS:
1. Write introduction (${Math.floor(targetWords * 0.1)} words) - NO keyword in first paragraph
2. For EACH section in outline, write ${Math.floor(targetWords / params.outline.sections.length)} words with:
   - Clear explanation of the topic
   - 1-2 concrete examples
   - Actionable insights
3. Write conclusion (${Math.floor(targetWords * 0.08)} words)
4. VERIFY you've written AT LEAST ${Math.floor(targetWords * 0.95)} words before finishing

CRITICAL: Each section MUST be ${Math.floor(targetWords / params.outline.sections.length)} words. Do NOT write short sections.

Include LSI keywords: ${(params.lsiKeywords && params.lsiKeywords.length > 0) ? params.lsiKeywords.join(', ') : 'none'}

Write the complete ${targetWords}-word article now.`;

  yield* generateAIStream({
    systemPrompt,
    userPrompt,
    temperature: 0.5, // Lower temperature for better instruction following
    maxTokens: streamMaxTokens,
    taskType: 'draft',
    useBulkModel: params.useBulkModel // Pass through bulk flag
  });
}

// Streaming functions for generate-all workflow
export async function* streamBriefRaw(params: {
  keyword: string;
  siteContext: {
    niche?: string;
    targetCountry?: string;
    language?: string;
    brandVoice?: (SiteBrandVoice & { expertPersona?: string }) | null;
  };
  serpContext?: SerpContext;
}): AsyncGenerator<string | { __done: BriefData }> {
  const { keyword, siteContext, serpContext } = params;

  const systemPrompt = `You are a senior SEO strategist. Create a brief that beats the competition by focusing on Topical Authority, EEAT, and Information Gain.

Return JSON with this exact shape:
{
  "intent": "Informational" | "Transactional" | "Navigational" | "Commercial Investigation",
  "articleType": string,
  "headings": string[],
  "questions": string[],
  "entities": string[],
  "internalLinkIdeas": string[],
  "externalLinkIdeas": string[],
  "competitorInsights": {
    "commonTopics": string[],
    "headingPatterns": string[],
    "contentGaps": string[],
    "sentiment": string
  },
  "informationGain": string[],
  "eeatOpportunities": string[]
}

"informationGain" should list unique points or perspectives not found in the SERP data.
"eeatOpportunities" should suggest how to demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness for this topic.

Response must be valid JSON only.`;

  const serpBlock = serpContext ? `
SERP DATA:
${serpContext.topResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n")}

People Also Ask:
${serpContext.peopleAlsoAsk.map(q => `- ${q.question}`).join("\n")}
` : "";

  const userPrompt = `Target keyword: "${keyword}"

Site context:
- Niche: ${siteContext.niche ?? "unspecified"}
- Country: ${siteContext.targetCountry ?? "global"}
- Language: ${siteContext.language ?? "en"}
- Voice: ${siteContext.brandVoice?.adjectives?.join(", ") ?? "neutral"}
- Tone: ${siteContext.brandVoice?.tone ?? "professional"}
- Audience: ${siteContext.brandVoice?.targetAudience ?? "general"}
${serpBlock}
Create the best SEO brief for this keyword.`;

  let fullText = "";
  for await (const chunk of generateAIStream({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 4000,
    taskType: 'brief',
    expectJSON: true
  })) {
    fullText += chunk;
    yield chunk;
  }

  try {
    const parsed = JSON.parse(fullText.trim()) as BriefData;
    if (!parsed.intent || !parsed.articleType || !Array.isArray(parsed.headings)) {
      throw new Error("Brief JSON missing required fields");
    }
    yield { __done: parsed };
  } catch (error) {
    throw new Error(`Failed to parse brief JSON: ${error}`);
  }
}

export async function* streamOutlineRaw(params: {
  brief: BriefData;
}): AsyncGenerator<string | { __done: OutlineData }> {
  const systemPrompt = `You are an SEO content strategist. Create a detailed outline optimized for Topical Authority and Featured Snippets.

Return JSON with this shape:
{
  "sections": [
    {
      "heading": string,
      "level": 2 | 3,
      "notes": string,
      "answerTarget": string | null,
      "isFaq": boolean
    }
  ],
  "structuralLogic": string
}

"answerTarget" should be a concise 40-60 word answer for a potential Featured Snippet if applicable to that section.
"structuralLogic" explains why this hierarchy satisfies the user intent.

Response must be valid JSON only.`;

  const userPrompt = `Brief: ${JSON.stringify(params.brief, null, 2)}

Create a clear, logical outline.`;

  let fullText = "";
  for await (const chunk of generateAIStream({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 3000,
    taskType: 'outline',
    expectJSON: true
  })) {
    fullText += chunk;
    yield chunk;
  }

  try {
    const parsed = JSON.parse(fullText.trim()) as OutlineData;
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Outline JSON missing sections");
    }
    yield { __done: parsed };
  } catch (error) {
    throw new Error(`Failed to parse outline JSON: ${error}`);
  }
}

export async function* streamOptimizationRaw(params: {
  keyword: string;
  content: string;
}): AsyncGenerator<string | { __done: OptimizationData }> {
  const systemPrompt = `You are an elite SEO auditor. Your goal is to provide actionable, advanced optimization suggestions to help this content rank #1.

Analyze the content for:
1. Topical Completeness: Are there any missing subtopics?
2. Entity Density: Are there missing related NLP entities?
3. Snippet Opportunities: Can we better target a Featured Snippet?
4. Internal/External Linking: Where should we link for maximum authority?
5. User Experience: Is the formatting and flow optimal?

Return JSON with this shape:
{
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "suggestions": string[],
  "lsiKeywords": string[],
  "schemaSuggestions": string[],
  "internalLinkingNotes": string
}

"suggestions" should be high-level strategic improvements.
"lsiKeywords" should be 15-20 highly relevant, semantic entities and phrases specific to the niche, NOT just generic terms. They must be crucial to building topical authority.
"schemaSuggestions" should suggest specific Schema.org types (e.g., FAQ, HowTo, Product).

Response must be valid JSON only.`;

  const userPrompt = `Target keyword: "${params.keyword}"

Content: ${params.content}

Provide optimization suggestions.`;

  let fullText = "";
  for await (const chunk of generateAIStream({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 2000,
    taskType: 'optimize',
    expectJSON: true
  })) {
    fullText += chunk;
    yield chunk;
  }

  try {
    const parsed = JSON.parse(fullText.trim()) as OptimizationData;
    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Optimization JSON missing suggestions");
    }
    yield { __done: parsed };
  } catch (error) {
    throw new Error(`Failed to parse optimization JSON: ${error}`);
  }
}

export async function optimizeContentWithSEOSuggestions(params: {
  content: string;
  keyword: string;
  suggestions: string[];
}): Promise<string> {
  const systemPrompt = `You are an SEO content optimizer. Your job is to improve content to address specific SEO issues while maintaining quality and readability.

Requirements:
- Fix ALL the issues listed
- Maintain the original tone and style
- Keep the same structure (headings, paragraphs)
- Ensure keyword density is 1-2%
- Place keyword naturally in title, first paragraph, and headings
- Keep sentences under 20 words average
- Maintain readability and flow

Return ONLY the optimized content, no explanations or commentary.`;

  const userPrompt = `TARGET KEYWORD: "${params.keyword}"

ISSUES TO FIX:
${params.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CONTENT TO OPTIMIZE:
${params.content}

Improve the content to address all these SEO issues.`;

  const response = await generateAI({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 8000,
    taskType: 'optimize'
  });

  return response.content;
}

export async function fixContentWithSuggestion(params: {
  content: string;
  suggestion: string;
  keyword?: string;
}): Promise<string> {
  const systemPrompt = `You are an SEO expert. Your job is to fix content based on a specific SEO suggestion.

Requirements:
- Apply ONLY the fix needed for this one suggestion
- Maintain the original markdown formatting and structure
- Keep the same tone and style
- Make minimal changes - only what's needed to address the suggestion

Return ONLY the improved content with the fix applied. No explanations.`;

  const userPrompt = `Suggestion: ${params.suggestion}
${params.keyword ? `Target Keyword: ${params.keyword}` : ""}

Current Content:
${params.content}

Fix this content based on the suggestion above.`;

  const response = await generateAI({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 4000,
    taskType: 'quick'
  });

  return response.content;
}

export async function generateAIResponse(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const response = await generateAI({
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature ?? 0.7,
    maxTokens: params.maxTokens ?? 4096,
    taskType: 'quick'
  });

  return response.content;
}

export async function generateSocialMedia(params: {
  content: string;
  keyword: string;
  tone: string;
}): Promise<import("./types").SocialMediaData> {
  const systemPrompt = `You are a social media expert specializing in repurposing long-form content into engaging, platform-specific posts.

Create multiple variations for each platform with these requirements:

TWITTER (3 variations):
- Max 280 characters
- Include relevant hashtags (2-3 max)
- Engaging hooks and questions
- Thread-worthy insights

LINKEDIN (3 variations):
- Professional tone, 1-3 paragraphs
- Industry insights and thought leadership
- Call-to-action for engagement
- Professional hashtags (3-5)

INSTAGRAM (3 variations):
- Visual storytelling approach
- Engaging captions with line breaks
- Story-driven content
- Trending hashtags (5-8)

FACEBOOK (3 variations):
- Conversational tone
- Community-focused content
- Questions to drive engagement
- Mix of short and longer posts

HASHTAGS:
- Generate 15-20 relevant hashtags
- Mix of popular and niche tags
- Include branded and industry-specific tags

CRITICAL: Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "twitter": ["post1", "post2", "post3"],
  "linkedin": ["post1", "post2", "post3"],
  "instagram": ["post1", "post2", "post3"],
  "facebook": ["post1", "post2", "post3"],
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`;

  const userPrompt = `Target keyword: "${params.keyword}"
Tone: ${params.tone}

Article content to repurpose:
${params.content.slice(0, 4000)}...

Generate platform-specific social media posts from this content. Return ONLY valid JSON.`;

  // Try Groq first (fast and reliable for JSON)
  try {
    const response = await generateAIJSON<{
      twitter: string[];
      linkedin: string[];
      instagram: string[];
      facebook: string[];
      hashtags: string[];
    }>({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 4000,
      taskType: 'social' // Will use Groq
    });

    return {
      twitter: response.twitter || [],
      linkedin: response.linkedin || [],
      instagram: response.instagram || [],
      facebook: response.facebook || [],
      hashtags: response.hashtags || [],
      generatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };
  } catch (groqError) {
    console.warn('Groq failed for social media, trying fallback:', groqError);
    
    // Fallback to OpenRouter/Gemini
    const response = await generateAI({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 4000,
      expectJSON: true,
      taskType: 'optimize' // Will try OpenRouter then Gemini
    });

    let socialData;
    try {
      // Clean up response if it has markdown code blocks
      let content = response.content.trim();
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
      }
      socialData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse social media JSON:', response.content);
      throw new Error('Failed to generate valid social media content');
    }

    return {
      twitter: socialData.twitter || [],
      linkedin: socialData.linkedin || [],
      instagram: socialData.instagram || [],
      facebook: socialData.facebook || [],
      hashtags: socialData.hashtags || [],
      generatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };
  }
}

// Export task assignments for monitoring
export function getTaskAssignments() {
  return {
    brief: TASK_PROVIDERS.brief[0],
    outline: TASK_PROVIDERS.outline[0],
    draft: TASK_PROVIDERS.draft[0],
    optimize: TASK_PROVIDERS.optimize[0],
    social: TASK_PROVIDERS.social[0],
    quick: TASK_PROVIDERS.quick[0]
  };
}
