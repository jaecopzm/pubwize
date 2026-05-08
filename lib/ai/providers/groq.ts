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

  private getModelQueue(request: AIRequest): string[] {
    const g = MODELS.groq as any;
    const primary = request.expectJSON
      ? g.json
      : request.useBulkModel && request.taskType === 'draft'
        ? g.draftBulk
        : g.draft;

    return [...new Set([primary, g.fallback1, g.fallback2, g.fallback3].filter(Boolean))];
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
          max_completion_tokens: request.maxTokens ?? 4096,
        }, { signal });

        const content = this.cleanContent(completion.choices?.[0]?.message?.content ?? "");

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
    const modelName = request.expectJSON ? MODELS.groq.json : MODELS.groq.draft;

    const stream = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      temperature: request.temperature ?? 0.7,
      max_completion_tokens: request.maxTokens ?? 4096,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}
