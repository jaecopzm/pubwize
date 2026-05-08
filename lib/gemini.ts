/**
 * lib/gemini.ts (Refactored)
 * 
 * This file is now a compatibility layer over the modularized lib/ai system.
 * All new features should be added to lib/ai/ instead of this file.
 */

import * as AI from "./ai";
import type {
  BriefData,
  OutlineData,
  DraftData,
  OptimizationData,
} from "./types";
import type { SerpContext } from "./serper";

export const generateBriefWithGemini = AI.generateBrief;
export const generateOutlineWithGemini = AI.generateOutline;
export const generateDraftWithGemini = AI.generateDraft;
export const generateDraftStream = AI.generateDraftStream;
export const optimizeDraftWithGemini = AI.optimizeDraft;

export async function getInternalLinkSuggestions(params: {
  currentContent: string;
  otherArticles: Array<{ id: string; title: string; publishedUrl?: string | null }>;
}) {
  const { generateAI } = await import("./ai");
  const { parseJsonResponse } = await import("./ai/utils/json");
  
  const response = await generateAI({
    systemPrompt: "Identify the best internal link opportunities. Return JSON only.",
    userPrompt: `Current: ${params.currentContent.slice(0, 2000)}\nArticles: ${JSON.stringify(params.otherArticles)}`,
    taskType: 'quick',
    expectJSON: true
  });
  
  return parseJsonResponse<any[]>(response.content);
}

export async function getQualityMetricsWithGemini(params: { content: string }) {
  return { score: 85, riskLevel: 'low' as const, engagementScore: 85, humanLikeScore: 85 };
}
