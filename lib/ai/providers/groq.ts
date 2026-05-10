import Groq from "groq-sdk";
import { BaseProvider } from "./base";
import { AIRequest, AIResponse } from "../types";
import { MODELS } from "../config";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey });
}

export class GroqProvider extends BaseProvider {
  name = 'groq' as const;
  private static readonly DEFAULT_MAX_TOKENS = 7000;

  private getModelQueue(request: AIRequest): string[] {
    const g = MODELS.groq as any;
    const primary = request.expectJSON ? g.json : g.draft;
    const fallbacks = [g.fallback1, g.fallback2];
    return [...new Set([primary, ...fallbacks].filter(Boolean))];
  }

  async generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
    const client = getClient();
    const modelQueue = this.getModelQueue(request);
    const errors: string[] = [];

    for (const modelName of modelQueue) {
      if (signal?.aborted) throw new Error("Request aborted");

      try {
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_completion_tokens: request.maxTokens ?? GroqProvider.DEFAULT_MAX_TOKENS,
          ...(request.topP !== undefined && { top_p: request.topP }),
          ...(request.reasoningEffort !== undefined && { reasoning_effort: request.reasoningEffort }),
        }, { signal });

        const content = this.cleanContent(
          completion.choices?.[0]?.message?.content ?? 
          completion.choices?.[0]?.message?.reasoning ?? 
          ""
        );

        if (!content || content.length < 5) {
          errors.push(`${modelName}: empty content`);
          console.warn(`[Groq] Model ${modelName} returned empty content, trying fallback...`);
          continue;
        }

        return { content, provider: 'groq', model: modelName };

      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("aborted") || msg.includes("abort")) throw err;

        const status = err?.status ?? err?.statusCode;
        const isRetryable = status === 429 || status >= 500 || status === 413;
        if (isRetryable) {
          errors.push(`${modelName}: ${status}`);
          console.warn(`[Groq] Model ${modelName} returned ${status}, trying fallback...`);
          continue;
        }

        errors.push(`${modelName}: ${msg}`);
        const isLast = modelName === modelQueue[modelQueue.length - 1];
        if (isLast) throw new Error(`All Groq models failed: ${errors.join('; ')}`);
        console.warn(`[Groq] Model ${modelName} error: ${msg}, trying fallback...`);
      }
    }

    throw new Error(`All Groq models exhausted: ${errors.join('; ')}`);
  }

  async *stream(request: AIRequest, signal?: AbortSignal): AsyncGenerator<string> {
    const client = getClient();
    const modelQueue = this.getModelQueue(request);
    
    console.log(`[Groq] Stream starting with models: ${modelQueue.join(', ')}`);
    
    for (const modelName of modelQueue) {
      if (signal?.aborted) throw new Error("Request aborted");
      
      try {
        console.log(`[Groq] Attempting stream with model: ${modelName}`);
        console.log(`[Groq] Prompt sizes - system: ${request.systemPrompt.length} chars, user: ${request.userPrompt.length} chars, max_tokens: ${Math.min(request.maxTokens ?? GroqProvider.DEFAULT_MAX_TOKENS, GroqProvider.DEFAULT_MAX_TOKENS)}`);
        
        const stream = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt }
          ],
          temperature: request.temperature ?? 0.7,
          max_completion_tokens: Math.min(request.maxTokens ?? GroqProvider.DEFAULT_MAX_TOKENS, GroqProvider.DEFAULT_MAX_TOKENS),
          stream: true,
          ...(request.topP !== undefined && { top_p: request.topP }),
        }, { signal });

        let chunkCount = 0;
        let finishReason = null;
        
        for await (const chunk of stream) {
          if (signal?.aborted) break;
          
          const choice = chunk.choices[0];
          const delta = choice?.delta;
          const text = delta?.content || null;
          
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }
          
          if (text) {
            chunkCount++;
            yield text;
          }
        }
        
        console.log(`[Groq] Stream completed with ${modelName}, chunks: ${chunkCount}, finish_reason: ${finishReason}`);
        return; // Success, exit
        
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("aborted") || msg.includes("abort")) throw err;
        
        const status = err?.status ?? err?.statusCode;
        const isRetryable = status === 429 || status >= 500;
        const isLast = modelName === modelQueue[modelQueue.length - 1];
        
        if (isRetryable && !isLast) {
          console.warn(`[Groq] Stream model ${modelName} returned ${status}, trying fallback...`);
          continue;
        }
        
        throw err;
      }
    }
  }
}
