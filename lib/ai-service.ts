/**
 * DEPRECATED: This file is legacy. Use lib/openrouter.ts instead.
 * 
 * Old AI service with fallback logic. Kept for reference.
 * All new code should use functions from @/lib/openrouter:
 * - generateBriefWithOpenRouter()
 * - generateOutlineWithOpenRouter()
 * - generateDraftWithOpenRouter()
 * - optimizeDraftWithOpenRouter()
 * - generateAIResponse()
 * - generateAIJSON()
 */

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: 'openrouter' | 'gemini';
  taskType?: 'brief' | 'draft' | 'optimize' | 'other';
}

// Rate limit tracking (minimal implementation for backward compatibility)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

/**
 * @deprecated Use generateAIResponse() from @/lib/openrouter instead
 */
export async function generateAIResponse(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { generateAIResponse: generate } = await import("./openrouter");
  return generate(params);
}

/**
 * @deprecated Use generateAIJSON() from @/lib/openrouter instead
 */
export async function generateAIJSON<T = unknown>(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const { generateAIJSON: generate } = await import("./openrouter");
  return generate<T>(params);
}

/**
 * @deprecated Minimal stub for backward compatibility
 * Always succeeds - rate limiting is handled by OpenRouter
 */
export function checkRateLimit(userId?: string): boolean {
  if (!userId) return true;

  const now = Date.now();
  const requests = rateLimitMap.get(userId) ?? [];

  // Clean old requests outside the window
  const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= RATE_LIMIT_MAX) {
    throw new Error("Rate limit exceeded - please wait before making another request");
  }

  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}
