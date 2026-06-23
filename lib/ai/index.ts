import { 
  AIRequest, 
  BriefData, 
  OutlineData, 
  DraftData, 
  OptimizationData, 
  SocialMediaData 
} from "./types";
import { generateAI, generateAIStream } from "./orchestrator";
import { parseJsonResponse } from "./utils/json";
import { getBriefSystemPrompt, getBriefUserPrompt } from "./prompts/brief";
import { getOutlineSystemPrompt, getOutlineUserPrompt } from "./prompts/outline";
import { getDraftSystemPrompt, getDraftUserPrompt } from "./prompts/draft";
import { getOptimizeSystemPrompt, getOptimizeUserPrompt } from "./prompts/optimize";
import { getSocialSystemPrompt, getSocialUserPrompt } from "./prompts/social";
import { SerpContext } from "../serper";

type ExternalSource = { title: string; url: string; snippet?: string };

/**
 * Generates a full SEO brief for a keyword.
 */
export async function generateBrief(params: {
  keyword: string;
  siteContext: any; // Using any to avoid deep type imports for now, can be refined
  serpContext?: SerpContext;
}): Promise<BriefData> {
  const response = await generateAI({
    systemPrompt: getBriefSystemPrompt(),
    userPrompt: getBriefUserPrompt(params),
    temperature: 0.7,
    maxTokens: 4000,
    taskType: 'brief',
    expectJSON: true
  });

  return parseJsonResponse<BriefData>(response.content, "brief");
}

/**
 * Generates a detailed article outline based on a brief.
 */
export async function generateOutline(params: { 
  brief: BriefData; 
  keyword: string 
}): Promise<OutlineData> {
  const response = await generateAI({
    systemPrompt: getOutlineSystemPrompt(params.keyword),
    userPrompt: getOutlineUserPrompt(params),
    temperature: 0.7,
    maxTokens: 3000,
    taskType: 'outline',
    expectJSON: true
  });

  return parseJsonResponse<OutlineData>(response.content, "outline");
}

/**
 * Generates a complete article draft.
 */
export async function generateDraft(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
  lsiKeywords?: string[];
  siteBrandVoice?: any;
  externalSources?: ExternalSource[] | null;
}): Promise<DraftData> {
  const targetWords = params.targetWordCount || 2500;
  
  // Calculate a reasonable initial token budget.
  const draftMaxTokens = Math.min(Math.ceil(targetWords * 2.5), 7000);

  // Attempt generation with initial token budget. If the model finishes due to length, retry with a higher budget.
  const response = await generateAI({
    systemPrompt: getDraftSystemPrompt({
      keyword: params.keyword,
      targetWords,
      outline: params.outline,
      siteBrandVoice: params.siteBrandVoice
    }),
    userPrompt: getDraftUserPrompt({
      ...params,
      targetWords
    }),
    temperature: 0.5,
    maxTokens: draftMaxTokens,
    taskType: 'draft'
  });

  // Normalize finish reason for length truncation (Gemini uses 'MAX_TOKENS', others use 'length')
  const isTruncated = response.finishReason === 'length' || response.finishReason === 'MAX_TOKENS';

  // If the response indicates a length cutoff, retry once with a higher budget (up to 12k).
  if (isTruncated) {
    const retryResponse = await generateAI({
      systemPrompt: getDraftSystemPrompt({
        keyword: params.keyword,
        targetWords,
        outline: params.outline,
        siteBrandVoice: params.siteBrandVoice
      }),
      userPrompt: getDraftUserPrompt({
        ...params,
        targetWords
      }),
      temperature: 0.5,
      maxTokens: 7500, // Reduced from 12000 to be safer
      taskType: 'draft'
    });
    return {
      content: retryResponse.content,
      format: "markdown"
    };
  }

  return {
    content: response.content,
    format: "markdown"
  };
}

/**
 * Streaming version of draft generation.
 */
export async function* generateDraftStream(params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWordCount?: number | null;
  lsiKeywords?: string[];
  siteBrandVoice?: any;
  internalLinkArticles?: any[];
  externalSources?: ExternalSource[] | null;
  seoSuggestions?: string[] | null;
}): AsyncGenerator<string> {
  const targetWords = params.targetWordCount || 2500;
  
  // Tighter budget: ~1.8 tokens per word cap at 6000 to prevent runaway generation.
  const streamMaxTokens = Math.min(Math.ceil(targetWords * 1.8), 6000);

  yield* generateAIStream({
    systemPrompt: getDraftSystemPrompt({
      keyword: params.keyword,
      targetWords,
      outline: params.outline,
      siteBrandVoice: params.siteBrandVoice
    }),
    userPrompt: getDraftUserPrompt({
      ...params,
      targetWords,
      seoSuggestions: params.seoSuggestions,
    }),
    temperature: 0.5,
    maxTokens: streamMaxTokens,
    taskType: 'draft'
  });
}

/**
 * Provides SEO optimization suggestions for a draft.
 */
export async function optimizeDraft(params: {
  keyword: string;
  content: string;
}): Promise<OptimizationData> {
  const response = await generateAI({
    systemPrompt: getOptimizeSystemPrompt(params.keyword),
    userPrompt: getOptimizeUserPrompt(params),
    temperature: 0.7,
    maxTokens: 2000,
    taskType: 'optimize',
    expectJSON: true
  });

  return parseJsonResponse<OptimizationData>(response.content, "optimization");
}

/**
 * Generates social media posts from article content.
 */
export async function generateSocialMedia(params: {
  content: string;
  keyword: string;
  tone: string;
}): Promise<SocialMediaData> {
  const response = await generateAI({
    systemPrompt: getSocialSystemPrompt(),
    userPrompt: getSocialUserPrompt(params),
    temperature: 0.8,
    maxTokens: 8000,
    taskType: 'social',
    expectJSON: true
  });

  const parsed = parseJsonResponse<any>(response.content, "social");
  
  return {
    ...parsed,
    generatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
  };
}

// Re-export core orchestrator functions for low-level access
export { generateAI, generateAIStream, getProviderStatus } from "./orchestrator";

// ─── Streaming wrappers for Auto-Pilot ───────────────────────────────
// These yield phased "thinking" status messages for JSON tasks,
// then yield the final parsed result as { __done: T }.
// This gives the Auto-Pilot real-time progress updates even for
// non-streaming JSON calls.

type StreamItem<T> = string | { __done: T };

const BRIEF_PHASES = [
  "Analyzing target keyword and search intent...",
  "Scanning competitor SERP landscape...",
  "Identifying content gaps and opportunities...",
  "Mapping EEAT authority signals...",
  "Building comprehensive content strategy...",
];

const OUTLINE_PHASES = [
  "Analyzing brief structure and key topics...",
  "Designing heading hierarchy for maximum coverage...",
  "Optimizing section flow for reader engagement...",
  "Targeting Featured Snippet opportunities...",
  "Finalizing article architecture...",
];

const OPTIMIZE_PHASES = [
  "Auditing keyword density and placement...",
  "Scanning for missing NLP entities...",
  "Evaluating Featured Snippet potential...",
  "Analyzing internal linking opportunities...",
  "Generating meta description and title...",
];

async function* phaseStream<T>(
  phases: string[],
  work: () => Promise<T>,
  intervalMs = 1800
): AsyncGenerator<StreamItem<T>> {
  let phaseIndex = 0;
  let done = false;
  let result: T | undefined;
  let error: Error | undefined;

  // Start the real work in the background
  const workPromise = work().then(
    (r) => { result = r; done = true; },
    (e) => { error = e; done = true; }
  );

  // Yield phase messages while work is in progress
  while (!done && phaseIndex < phases.length) {
    yield phases[phaseIndex] + "\n";
    phaseIndex++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // If work is still running after all phases, just wait
  if (!done) {
    yield "Finalizing...\n";
    await workPromise;
  }

  if (error) throw error;
  yield { __done: result! };
}

/**
 * Streams brief generation with thinking phases.
 */
export async function* streamBriefRaw(params: {
  keyword: string;
  siteContext: any;
  serpContext?: SerpContext;
}): AsyncGenerator<StreamItem<BriefData>> {
  yield* phaseStream(BRIEF_PHASES, () => generateBrief(params));
}

/**
 * Streams outline generation with thinking phases.
 */
export async function* streamOutlineRaw(params: {
  brief: BriefData;
  keyword?: string;
}): AsyncGenerator<StreamItem<OutlineData>> {
  yield* phaseStream(OUTLINE_PHASES, () =>
    generateOutline({ brief: params.brief, keyword: params.keyword || "" })
  );
}

/**
 * Streams optimization with thinking phases.
 */
export async function* streamOptimizationRaw(params: {
  keyword: string;
  content: string;
}): AsyncGenerator<StreamItem<OptimizationData>> {
  yield* phaseStream(OPTIMIZE_PHASES, () => optimizeDraft(params));
}
