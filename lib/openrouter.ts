import type {
    BriefData,
    OutlineData,
    DraftData,
    OptimizationData,
} from "./types";
import type { SerpContext } from "./serper";

/**
 * Attempts to repair a truncated JSON string by closing unclosed brackets/braces/quotes.
 */
function tryFixTruncatedJson(text: string): string {
    let fixed = text.trim();

    // 1. Remove trailing comma if it exists (e.g., {"a": 1, )
    fixed = fixed.replace(/,\s*$/, "");

    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        if (char === '"' && !escaped) {
            inString = !inString;
        }
        if (inString) {
            if (char === "\\" && !escaped) {
                escaped = true;
            } else {
                escaped = false;
            }
            continue;
        }

        if (char === "{" || char === "[") {
            stack.push(char);
        } else if (char === "}") {
            if (stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
            if (stack[stack.length - 1] === "[") stack.pop();
        }
    }

    // 2. If we are inside a string, close it
    if (inString) {
        fixed += '"';
    }

    // 3. Close unclosed objects and arrays in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === "{") fixed += "}";
        else if (last === "[") fixed += "]";
    }

    return fixed;
}

/**
 * Try to parse a string into JSON with several fallbacks.
 * - Strips common code fences
 * - Attempts direct JSON.parse
 * - Attempts to extract the outermost {...} or [...] substring
 * - Attempts to fix truncation if both fail
 */
function parseJsonResponse(text: string, label = "response") {
    let trimmed = text.trim();
    // strip triple-backtick fences
    if (trimmed.startsWith("```")) {
        trimmed = trimmed.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    // Standard attempt
    const attempt = (s: string) => {
        try {
            return JSON.parse(s);
        } catch {
            return null;
        }
    };

    // 1. Try direct
    let result = attempt(trimmed);
    if (result) return result;

    // 2. Try extraction
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        result = attempt(trimmed.slice(firstBrace, lastBrace + 1));
        if (result) return result;
    }

    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        result = attempt(trimmed.slice(firstBracket, lastBracket + 1));
        if (result) return result;
    }

    // 3. Try to fix truncation
    console.warn(`Attempting to fix potentially truncated JSON for ${label}...`);
    const fixed = tryFixTruncatedJson(trimmed);
    result = attempt(fixed);
    if (result) {
        console.log(`Successfully recovered JSON for ${label} using fix logic.`);
        return result;
    }

    // 4. One last ditch regex attempt for objects
    const objMatch = trimmed.match(/\{[\s\S]*/); // Find start and take everything
    if (objMatch) {
        const fixedRegex = tryFixTruncatedJson(objMatch[0]);
        result = attempt(fixedRegex);
        if (result) return result;
    }

    console.error(`Failed to parse JSON ${label}:`, trimmed.substring(0, 2000));
    throw new Error(`Failed to parse JSON ${label}`);
}

// OpenRouter free models for different tasks
const MODELS = {
    // Best for structured JSON output (brief, outline, optimization)
    JSON_EXPERT: "nvidia/nemotron-3-nano-30b-a3b:free", // Upgrading to a more robust model for JSON

    // Excellent for long-form content generation
    DRAFT: "arcee-ai/trinity-large-preview:free",

    // Fast model for quick tasks
    FAST: "nvidia/nemotron-3-nano-30b-a3b:free",

    // Fallback models
    FALLBACK_1: "arcee-ai/trinity-large-preview:free",
    FALLBACK_2: "nvidia/nemotron-3-nano-30b-a3b:free",
};

// Rotate through models to avoid rate limits (stateless for serverless)
function getNextModel(): string {
    const models = [MODELS.JSON_EXPERT, MODELS.FAST, MODELS.FALLBACK_1];
    const randomIndex = Math.floor(Math.random() * models.length);
    return models[randomIndex];
}

interface OpenRouterRequest {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    temperature?: number;
    max_tokens?: number;
}

function getApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }
    return apiKey;
}

async function callOpenRouter(request: OpenRouterRequest): Promise<string> {
    const apiKey = getApiKey();
    const controller = new AbortController();
    const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS) || 120000; // Increased to 120s for slow models
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
                "X-Title": "PubWize",
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 4096,
            }),
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`OpenRouter fetch error (${request.model}):`, err);
        throw new Error(`OpenRouter fetch failed: ${msg}`);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`OpenRouter error (${request.model}):`, response.status, errorText.substring(0, 2000));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json().catch((e) => {
        console.error("OpenRouter returned non-JSON response", e);
        throw e;
    });

    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response from OpenRouter");
    }

    return data.choices[0].message.content.trim();
}

async function callOpenRouterWithRetry(
    request: OpenRouterRequest,
    retries: number = 2
): Promise<string> {
    try {
        return await callOpenRouter(request);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const shouldRetry = retries > 0 && /429|overloaded|ETIMEDOUT|timed out|fetch failed|network|ECONNREFUSED|502|503|504/i.test(errorMessage);
        if (shouldRetry) {
            const delayMs = 1000 * Math.pow(2, Math.max(0, 2 - retries));
            console.log(`OpenRouter request failed (${errorMessage}). Retrying with different model in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
            const newModel = getNextModel();
            return callOpenRouterWithRetry({ ...request, model: newModel }, retries - 1);
        }
        throw error;
    }
}

export async function generateBriefWithOpenRouter(params: {
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

    const systemPrompt = `
You are a senior SEO strategist. Your goal is to create a brief that doesn't just "match" the competition, but "beats" it.

Return a JSON object with this exact shape:
{
  "intent": string,
  "articleType": string,
  "headings": string[],
  "questions": string[],
  "entities": string[],
  "internalLinkIdeas": string[],
  "externalLinkIdeas": string[],
  "competitorInsights": {
    "commonTopics": string[],
    "headingPatterns": string[],
    "contentGaps": string[]
  }
}

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.
`;

    const serpBlock = serpContext
        ? `
LIVE SERP DATA (Analyze this to find what competitors are missing):

Top 10 Ranking Pages:
${serpContext.topResults.map((r, i) => `${i + 1}. ${r.title}\n   Snippet: ${r.snippet}`).join("\n")}

People Also Ask:
${serpContext.peopleAlsoAsk.map((q) => `- ${q.question}`).join("\n")}
`
        : "";

    const userPrompt = `
Target keyword: "${keyword}"

Site context:
- Niche: ${siteContext.niche ?? "unspecified"}
- Target country: ${siteContext.targetCountry ?? "global"}
- Language: ${siteContext.language ?? "en"}
- Voice adjectives: ${siteContext.brandVoice?.adjectives?.join(", ") ?? "neutral, expert"}
- Voice tone: ${siteContext.brandVoice?.tone ?? "unspecified"}
- Target audience: ${siteContext.brandVoice?.targetAudience ?? "unspecified"}
- Formatting rules: ${siteContext.brandVoice?.formattingRules ?? "none"}
${serpBlock}
Create the best possible SEO brief for an article that will rank for this keyword and help the niche site owner monetize via affiliates or ads.
`;

    const response = await callOpenRouterWithRetry({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = parseJsonResponse(text, "brief");

    const brief = parsed as BriefData;
    if (
        !brief.intent ||
        !brief.articleType ||
        !Array.isArray(brief.headings) ||
        !Array.isArray(brief.questions)
    ) {
        throw new Error("OpenRouter brief JSON missing required fields");
    }

    return brief;
}

export async function generateOutlineWithOpenRouter(params: {
    brief: BriefData;
}): Promise<OutlineData> {
    const systemPrompt = `
You are an expert SEO content strategist.

Given an article brief, create a detailed outline with an ordered list of sections.

Return JSON only with this shape:
{
  "sections": [
    {
      "heading": string,
      "notes": string
    }
  ]
}

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.
`;

    const userPrompt = `
Here is the article brief as JSON:

${JSON.stringify(params.brief, null, 2)}

Create a clear, logically ordered outline that fully covers the brief.
`;

    const response = await callOpenRouterWithRetry({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000, // Increased from 1500 to prevent truncation
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = parseJsonResponse(text, "outline");
    const outline = parsed as OutlineData;
    if (!outline.sections || !Array.isArray(outline.sections)) {
        throw new Error("OpenRouter outline JSON missing required fields");
    }

    return outline;
}

export async function generateDraftWithOpenRouter(params: {
    outline: OutlineData;
    keyword: string;
    tone: string;
    targetWordCount?: number | null;
    siteBrandVoice?: {
        adjectives?: string[];
        tone?: string;
        targetAudience?: string;
        formattingRules?: string;
    } | null;
}): Promise<DraftData> {
    const brandVoiceBlock = params.siteBrandVoice ? `
\n## BRAND PERSONA (HIGHEST PRIORITY - THESE RULES OVERRIDE ALL OTHERS):
- **Voice adjectives:** ${params.siteBrandVoice.adjectives?.join(", ") || 'none specified'}
- **Voice/Tone:** ${params.siteBrandVoice.tone || 'Not specified'}
- **Target Audience:** ${params.siteBrandVoice.targetAudience || 'Not specified'}
- **Non-Negotiable Formatting Rules:**
${params.siteBrandVoice.formattingRules || 'None'}
` : '';

    const systemPrompt = `
You are a professional SEO content writer specializing in creating engaging, well-structured articles that are easy to read and rank well.

CRITICAL FORMATTING RULES:
1. Use proper Markdown heading hierarchy:
   - # for the main title (H1) - use ONCE at the top, MUST include the target keyword
   - ## for major sections (H2) - include keyword variations in 2-3 headings
   - ### for subsections (H3)
   - #### for minor subsections (H4)

2. READABILITY & FORMATTING REQUIREMENTS (CRITICAL - AIM FOR 90+ FLESCH SCORE):
   - Keep sentences VERY SHORT (10-15 words maximum)
   - Use simple, everyday words. Explain any necessary industry terms simply.
   - Write at a 5th-grade reading level (extremely conversational and clear)
   - Use active voice ONLY
   - Short paragraphs: 1-3 sentences maximum
   - DO NOT LEAVE EXCESSIVE SPACING: Use exactly ONE blank line between headings and the following paragraph. No multiple empty lines.
   - Use transition words: "However", "Therefore", "Additionally", "For example"

3. KEYWORD OPTIMIZATION (CRITICAL):
   - Target keyword density: 1.5-2% (use keyword 15-20 times per 1000 words)
   - Include exact keyword in:
     * First paragraph (first 100 words)
     * At least 2-3 H2 headings
     * Naturally throughout the content
     * Final paragraph/conclusion
   - Use keyword variations and synonyms
   - Don't force it - keep it natural and readable

4. Content formatting:
   - Use **bold** for key points and important terms
   - Use *italics* for subtle emphasis
   - Include bullet points (-) for lists
   - Use numbered lists (1.) for steps or sequences
   - Add examples and practical tips

5. VISUALS (NEW):
   - Every 300-400 words, insert an image placeholder like: [IMAGE_SUGGESTION: descriptive search query]
   - The query should be specific to the paragraph's context (e.g., "coffee beans roasting" instead of just "coffee").

6. Content structure:
   - Compelling introduction (2-3 short paragraphs, include keyword in first paragraph)
   - Follow the outline structure provided
   - Strong conclusion with key takeaways (include keyword)
   - Make it actionable and practical

Return ONLY the article content as clean Markdown text (no JSON, no code blocks, no backticks).
${brandVoiceBlock}
`;

    const userPrompt = `
Target keyword: "${params.keyword}"
Tone: ${params.tone}
Target word count: ${params.targetWordCount ?? "2000-2500 words"}

IMPORTANT REQUIREMENTS:
1. Use the keyword "${params.keyword}" 15-20 times throughout the article (1.5-2% density)
2. Keep ALL sentences under 15 words for a Flesch score of 90+
3. Write at a 5th-grade reading level - use extremely simple, clear language
4. Include the keyword in the title, first paragraph, 2-3 headings, and conclusion
5. Format spacing strictly: Exactly ONE blank newline after a heading.

Outline to follow:
${JSON.stringify(params.outline, null, 2)}

Write a complete, engaging article that is EASY TO READ and well-optimized for the keyword "${params.keyword}". Focus on clarity, simplicity, and natural keyword usage.
`;

    const response = await callOpenRouterWithRetry({
        model: MODELS.DRAFT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
    });

    let content = response.trim();
    if (content.startsWith("```")) {
        content = content.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    const draft: DraftData = {
        content,
        format: "markdown",
    };

    return draft;
}

/**
 * Streaming version — yields text chunks as they arrive from OpenRouter.
 */
export async function* generateDraftStream(params: {
    outline: OutlineData;
    keyword: string;
    tone: string;
    targetWordCount?: number | null;
    // accepts the full site-level brand voice, including adjectives + persona
    siteBrandVoice?: {
        adjectives?: string[];
        tone?: string;
        targetAudience?: string;
        formattingRules?: string;
    } | null;
    internalLinkArticles?: Array<{ keyword: string; publishedUrl?: string | null }> | null;
}): AsyncGenerator<string> {
    const brandVoiceStreamBlock = params.siteBrandVoice ? `

## BRAND PERSONA (HIGHEST PRIORITY - THESE RULES OVERRIDE ALL OTHERS):
- **Voice adjectives:** ${params.siteBrandVoice.adjectives?.join(", ") || 'none specified'}
- **Your Voice/Tone:** ${params.siteBrandVoice.tone || 'Not specified'}
- **Target Audience:** ${params.siteBrandVoice.targetAudience || 'Not specified'}
- **Non-Negotiable Formatting Rules:**
${params.siteBrandVoice.formattingRules || 'None'}` : '';

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
${brandVoiceStreamBlock}
`;

    const internalLinksBlock = (params.internalLinkArticles && params.internalLinkArticles.length > 0)
        ? '\n\nINTERNAL LINK OPPORTUNITIES:\nThe site has other published articles. If you naturally mention any of these topics, convert that anchor text into a Markdown hyperlink [anchor text](url). Only do this when it flows naturally—never force it.\n' +
        params.internalLinkArticles
            .filter(a => a.publishedUrl)
            .map(a => `- "${a.keyword}" -> ${a.publishedUrl}`)
            .join('\n')
        : '';

    const userPrompt = `
Target keyword: "${params.keyword}"
Tone: ${params.tone}
Target word count: ${params.targetWordCount ?? "2000-2500 words"}

Outline to follow:
${JSON.stringify(params.outline, null, 2)}
${internalLinksBlock}
Write a complete, engaging article that is EASY TO READ and well-optimized for the keyword "${params.keyword}".
`;

    const apiKey = getApiKey();

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
                "X-Title": "PubWize",
            },
            body: JSON.stringify({
                model: MODELS.DRAFT,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 8000,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter streaming error: ${response.status} - ${error}`);
        }

        console.log(`[Stream] Established connection with open router, reading response streams...`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last partial line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

                if (trimmedLine.startsWith("data: ")) {
                    const data = trimmedLine.slice(6);
                    try {
                        let parsedData = data;
                        // Some models attach '[DONE]' to the last chunk string instead of a separate event
                        if (data.endsWith('[DONE]')) {
                            parsedData = data.slice(0, -6).trim();
                        }

                        if (!parsedData) continue;

                        const parsed = JSON.parse(parsedData);
                        const text = parsed.choices?.[0]?.delta?.content;
                        if (text && typeof text === 'string') {
                            if (isFirstChunk) {
                                // Add 2kb of whitespace to force Nginx/Vercel proxies to flush the buffer
                                const padding = " ".repeat(2048);
                                console.log(`[Stream] Yielding first chunk with padding to force flush`);
                                yield padding + text;
                                isFirstChunk = false;
                            } else {
                                console.log(`[Stream] Yielding chunk of length ${text.length}`);
                                yield text;
                            }
                        }
                    } catch (e: any) {
                        // console.warn('Failed to parse streaming chunk:', data, e.message);
                        // but usually SSE is line-based. We'll skip for now.
                    }
                }
            }
        }
    } catch (error) {
        console.error("Streaming error:", error);
        throw error;
    }
}

/**
 * Core streaming helper — yields raw text tokens from any OpenRouter request.
 * Used by brief, outline, and SEO streaming generators below.
 */
async function* streamRaw(request: OpenRouterRequest): AsyncGenerator<string> {
    const apiKey = getApiKey();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
            "X-Title": "PubWize",
        },
        body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 4096,
            stream: true,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter streaming error: ${response.status} - ${err}`);
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
            if (!data) continue;

            try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content;
                if (text && typeof text === "string") yield text;
            } catch {
                // skip malformed chunk
            }
        }
    }
}

/**
 * Streams raw tokens for brief generation, then yields the parsed BriefData at the end.
 * Events yielded: string tokens, then { __done: BriefData }
 */
export async function* streamBriefRaw(params: {
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
}): AsyncGenerator<string | { __done: BriefData }> {
    const { keyword, siteContext, serpContext } = params;

    const systemPrompt = `You are a senior SEO strategist. Your goal is to create a brief that doesn't just "match" the competition, but "beats" it.

Return a JSON object with this exact shape:
{
  "intent": string,
  "articleType": string,
  "headings": string[],
  "questions": string[],
  "entities": string[],
  "internalLinkIdeas": string[],
  "externalLinkIdeas": string[],
  "competitorInsights": {
    "commonTopics": string[],
    "headingPatterns": string[],
    "contentGaps": string[]
  }
}

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.`;

    const serpBlock = serpContext
        ? `\nLIVE SERP DATA:\n${serpContext.topResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n")}\n\nPeople Also Ask:\n${serpContext.peopleAlsoAsk.map((q) => `- ${q.question}`).join("\n")}`
        : "";

    const userPrompt = `Target keyword: "${keyword}"\nSite context:\n- Niche: ${siteContext.niche ?? "unspecified"}\n- Country: ${siteContext.targetCountry ?? "global"}\n- Language: ${siteContext.language ?? "en"}\n- Voice adjectives: ${siteContext.brandVoice?.adjectives?.join(", ") ?? "neutral, expert"}\n- Voice tone: ${siteContext.brandVoice?.tone ?? "unspecified"}\n- Target audience: ${siteContext.brandVoice?.targetAudience ?? "unspecified"}\n- Formatting rules: ${siteContext.brandVoice?.formattingRules ?? "none"}${serpBlock}\nCreate the best possible SEO brief.`;

    let fullText = "";
    for await (const chunk of streamRaw({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
    })) {
        fullText += chunk;
        yield chunk;
    }

    const parsed = parseJsonResponse(fullText, "brief") as BriefData;
    if (!parsed.intent || !parsed.articleType || !Array.isArray(parsed.headings)) {
        throw new Error("Brief JSON missing required fields");
    }
    yield { __done: parsed };
}

/**
 * Streams raw tokens for outline generation, then yields the parsed OutlineData at the end.
 */
export async function* streamOutlineRaw(params: {
    brief: BriefData;
}): AsyncGenerator<string | { __done: OutlineData }> {
    const systemPrompt = `You are an expert SEO content strategist.

Given an article brief, create a detailed outline with an ordered list of sections.

Return JSON only with this shape:
{
  "sections": [
    {
      "heading": string,
      "notes": string
    }
  ]
}

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.`;

    const userPrompt = `Here is the article brief as JSON:\n\n${JSON.stringify(params.brief, null, 2)}\n\nCreate a clear, logically ordered outline.`;

    let fullText = "";
    for await (const chunk of streamRaw({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
    })) {
        fullText += chunk;
        yield chunk;
    }

    const parsed = parseJsonResponse(fullText, "outline") as OutlineData;
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error("Outline JSON missing sections");
    }
    yield { __done: parsed };
}

/**
 * Streams raw tokens for SEO optimization, then yields the parsed OptimizationData at the end.
 */
export async function* streamOptimizationRaw(params: {
    keyword: string;
    content: string;
}): AsyncGenerator<string | { __done: OptimizationData }> {
    const systemPrompt = `You are an on-page SEO expert.

Given an article draft and target keyword, review the content and suggest improvements.

Return JSON only with this shape:
{
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "suggestions": string[],
  "lsiKeywords": string[]
}

"suggestions" should be a concise list of specific, high-impact improvement ideas.
"lsiKeywords" must be an array of 5-8 highly relevant semantic or LSI keywords.

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.`;

    const userPrompt = `Target keyword: "${params.keyword}"\n\nHere is the current article draft in Markdown:\n\n${params.content}`;

    let fullText = "";
    for await (const chunk of streamRaw({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    })) {
        fullText += chunk;
        yield chunk;
    }

    const parsed = parseJsonResponse(fullText, "optimization") as OptimizationData;
    if (!Array.isArray(parsed.suggestions)) {
        throw new Error("Optimization JSON missing suggestions");
    }
    yield { __done: parsed };
}

export async function optimizeDraftWithOpenRouter(params: {
    keyword: string;
    content: string;
}): Promise<OptimizationData> {
    const systemPrompt = `
You are an on-page SEO expert.

Given an article draft and target keyword, review the content and suggest improvements.

Return JSON only with this shape:
{
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "suggestions": string[],
  "lsiKeywords": string[]
}

"suggestions" should be a concise list of specific, high-impact improvement ideas
about headings, keyword usage, internal links, FAQs, and overall structure.

"lsiKeywords" must be an array of 5-8 highly relevant semantic or LSI keywords related to the main target keyword that should be included in the article content.

The response MUST be valid JSON only. Do not include markdown, backticks, or any prose.
`;

    const userPrompt = `
Target keyword: "${params.keyword}"

Here is the current article draft in Markdown:

${params.content}
`;

    const response = await callOpenRouterWithRetry({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = parseJsonResponse(text, "optimization");
    const data = parsed as OptimizationData;
    if (!Array.isArray(data.suggestions)) {
        throw new Error("OpenRouter optimization JSON missing suggestions");
    }

    return data;
}

export async function getInternalLinkSuggestions(params: {
    currentContent: string;
    otherArticles: Array<{ id: string; title: string; publishedUrl?: string | null }>;
}): Promise<
    Array<{
        anchorText: string;
        targetArticleId: string;
        targetArticleTitle: string;
        targetArticleUrl: string;
        context: string;
    }>
> {
    if (params.otherArticles.length === 0) return [];

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
    "context": string
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
${params.otherArticles.map((a) => `- [ID: ${a.id}] ${a.title} (URL: ${a.publishedUrl ?? "not published yet"})`).join("\n")}

Identify up to 3 best internal link opportunities.
`;

    const response = await callOpenRouterWithRetry({
        model: MODELS.FAST,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    try {
        const suggestions = parseJsonResponse(text, "internal-link-suggestions");
        return Array.isArray(suggestions) ? suggestions : [];
    } catch (err) {
        console.error("Failed to parse internal link suggestions:", err instanceof Error ? err.message : err);
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
    const systemPrompt = `
You are a content quality auditor. Analyze the provided article for depth, engagement, and AI-like patterns.

Return JSON only with this shape:
{
  "engagementScore": number,
  "humanLikeScore": number,
  "uniquenessScore": number,
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

    const response = await callOpenRouterWithRetry({
        model: MODELS.FAST,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    try {
        const audit: any = parseJsonResponse(text, "quality-audit");
        const score = Math.round(
            (audit.engagementScore + audit.humanLikeScore + audit.uniquenessScore) / 3
        );
        return {
            score,
            riskLevel: audit.riskLevel || "low",
            engagementScore: audit.engagementScore || 0,
            humanLikeScore: audit.humanLikeScore || 0,
        };
    } catch (err) {
        console.error("Failed to parse quality metrics, returning defaults:", err instanceof Error ? err.message : err);
        return { score: 70, riskLevel: "low", engagementScore: 70, humanLikeScore: 70 };
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

    const response = await callOpenRouterWithRetry({
        model: MODELS.DRAFT,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
    });

    return response.trim();
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

    const response = await callOpenRouterWithRetry({
        model: MODELS.FAST,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
    });

    return response.trim();
}

/**
 * General-purpose AI response generation
 * Used for content improvements, regenerations, and other text tasks
 */
export async function generateAIResponse(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<string> {
    const response = await callOpenRouterWithRetry({
        model: MODELS.DRAFT,
        messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
    });

    return response.trim();
}

/**
 * General-purpose JSON generation
 * Used for structured data extraction and analysis
 */
export async function generateAIJSON<T = unknown>(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<T> {
    const response = await callOpenRouterWithRetry({
        model: MODELS.JSON_EXPERT,
        messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2000,
    });

    let text = response.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    try {
        return parseJsonResponse(text, "ai-json") as T;
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Failed to parse JSON response:", errorMsg);
        throw new Error(`Failed to parse AI response as JSON: ${errorMsg}`);
    }
}
