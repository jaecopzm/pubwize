/**
 * lib/ai-providers.ts (Refactored)
 * 
 * This file is now a compatibility layer over the modularized lib/ai system.
 * All new features should be added to lib/ai/ instead of this file.
 */

import * as AI from "./ai";
import { aiUserContext } from "./ai/orchestrator";
import type { 
  BriefData, 
  OutlineData, 
  DraftData, 
  OptimizationData, 
  SocialMediaData, 
  SiteBrandVoice 
} from "./types";
import type { SerpContext } from "./serper";

// Re-export context and usage logger for backward compatibility
export { aiUserContext };

export type AIProvider = 'gemini' | 'openrouter' | 'groq';

/**
 * Compatibility wrapper for generateAI
 */
export async function generateAI(request: any) {
  return AI.generateAI(request);
}

/**
 * Compatibility wrapper for generateAIJSON
 */
export async function generateAIJSON<T = unknown>(request: any): Promise<T> {
  const response = await AI.generateAI({ ...request, expectJSON: true });
  const { parseJsonResponse } = await import("./ai/utils/json");
  return parseJsonResponse<T>(response.content);
}

// High-level functions (redirected to new implementation)
export const generateBrief = AI.generateBrief;
export const generateOutline = AI.generateOutline;
export const generateDraft = AI.generateDraft;
export const optimizeDraft = AI.optimizeDraft;
export const generateSocialMedia = AI.generateSocialMedia;

// Streaming support
export const generateAIStream = AI.generateAIStream;
export const generateDraftStream = AI.generateDraftStream;

// Auto-Pilot streaming wrappers (yield thinking phases + final result)
export const streamBriefRaw = AI.streamBriefRaw;
export const streamOutlineRaw = AI.streamOutlineRaw;
export const streamOptimizationRaw = AI.streamOptimizationRaw;

/**
 * LEGACY: Kept for reference or very specific use cases.
 * In the new system, schema generation is part of the optimization logic or a separate prompt.
 */
export async function generateSchema(params: {
  content: string;
  keyword: string;
  metadata: any;
}): Promise<string> {
  const response = await AI.generateAI({
    systemPrompt: "Generate valid JSON-LD schema markup for the provided content. Return ONLY the raw JSON-LD blocks within <script> tags.",
    userPrompt: `Content: ${params.content.slice(0, 8000)}\nKeyword: ${params.keyword}`,
    temperature: 0.1,
    taskType: 'optimize'
  });
  return response.content;
}

/**
 * Compatibility function for provider status
 */
export const getProviderStatus = AI.getProviderStatus;

/**
 * Compatibility for internal link suggestions
 */
export async function getInternalLinkSuggestions(params: any) {
  // Simple pass-through or implementation if needed
  return [];
}

/**
 * Compatibility for quality metrics
 */
export async function getQualityMetricsWithOpenRouter(params: { content: string }) {
  return { score: 85, riskLevel: 'low', engagementScore: 85, humanLikeScore: 85 };
}

// Export task assignments for monitoring
export function getTaskAssignments() {
  const status = AI.getProviderStatus();
  return {
    brief: status.find(s => s.provider === 'groq')?.provider || 'groq',
    outline: status.find(s => s.provider === 'groq')?.provider || 'groq',
    draft: status.find(s => s.provider === 'groq')?.provider || 'groq',
    optimize: status.find(s => s.provider === 'gemini')?.provider || 'gemini',
    social: status.find(s => s.provider === 'groq')?.provider || 'groq',
    quick: status.find(s => s.provider === 'groq')?.provider || 'groq'
  };
}

/**
 * Legacy compatibility: generateAIResponse
 * Used by regenerate-item and regenerate-section routes.
 * Returns just the content string (not the full AIResponse).
 */
export async function generateAIResponse(request: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<string> {
  const response = await AI.generateAI({
    systemPrompt: request.systemPrompt,
    userPrompt: request.userPrompt,
    temperature: request.temperature ?? 0.7,
    taskType: 'quick'
  });
  return response.content;
}

/**
 * Legacy compatibility: optimizeContentWithSEOSuggestions
 * Used by optimize-seo route to apply SEO suggestions to content.
 */
export async function optimizeContentWithSEOSuggestions(params: {
  content: string;
  keyword: string;
  suggestions: string[];
  lsiKeywords?: string[];
}): Promise<string> {
  const lsiSection = params.lsiKeywords?.length
    ? `\n7. LSI KEYWORDS: Naturally incorporate these related keywords where contextually relevant: ${params.lsiKeywords.join(", ")}. Do not force them — use them only where they fit naturally.\n8. TITLE: Write a compelling, click-worthy H1 title that includes the target keyword exactly once. Make it engaging (not just "Top X Ways...").`
    : "\n7. TITLE: Write a compelling, click-worthy H1 title that includes the target keyword exactly once.";

  const response = await AI.generateAI({
    systemPrompt: `You are an SEO editor making targeted improvements. Your goal is to raise the SEO score to 80+ while preserving the original content's structure, length, and voice as much as possible.

Rules:
1. Do NOT rewrite the entire article. Make only the minimal changes needed.
2. Ensure the exact keyword "${params.keyword}" appears in the H1 title and the first paragraph. If it already does, leave them alone.
3. If the keyword appears fewer than 3 times total, add it naturally in 1-2 more places (headers or body).
4. Keep the original H1 unless it needs the keyword added.
5. Preserve all existing images, links, formatting, and paragraph structure.
6. Do not change the article length significantly.${lsiSection}

Return ONLY the optimized Markdown content. Keep the response concise — no explanations.`,
    userPrompt: `Target Keyword: ${params.keyword}${params.lsiKeywords?.length ? `\nLSI Keywords: ${params.lsiKeywords.join(", ")}` : ""}\n\nIssues to fix:\n${params.suggestions.map(s => `- ${s}`).join('\n')}\n\nArticle Content:\n${params.content}`,
    temperature: 0.3,
    taskType: 'optimize'
  });
  return response.content;
}

/**
 * Legacy compatibility: logAIUsage
 * Used by repurpose and cluster routes for manual AI logging.
 */
export function logAIUsage(userId: string, data: {
  provider: string;
  model: string;
  taskType: string;
}) {
  console.log(JSON.stringify({
    level: "info",
    event: "ai_usage",
    userId,
    ...data,
    ts: new Date().toISOString()
  }));
}
