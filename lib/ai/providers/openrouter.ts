import { BaseProvider } from "./base";
import { AIRequest, AIResponse } from "../types";
import { MODELS } from "../config";

const OR_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider extends BaseProvider {
  name = 'openrouter' as const;

  private getHeaders() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com",
      "X-Title": "PubWize",
    };
  }

  async generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
    if (signal?.aborted) throw new Error("Request aborted before OpenRouter call");

    const modelName = request.expectJSON ? MODELS.openrouter.json : MODELS.openrouter.draft;

    const response = await fetch(OR_API_URL, {
      method: "POST",
      signal,
      headers: this.getHeaders(),
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
    const content = this.cleanContent(data.choices?.[0]?.message?.content ?? "");
    if (!content) throw new Error("OpenRouter returned empty content");

    const finishReason = data.choices?.[0]?.finish_reason || undefined;

    return { content, provider: 'openrouter', model: modelName, finishReason };
  }

  async *stream(request: AIRequest, signal?: AbortSignal): AsyncGenerator<string> {
    const modelName = request.expectJSON ? MODELS.openrouter.json : MODELS.openrouter.draft;

    const response = await fetch(OR_API_URL, {
      method: "POST",
      signal,
      headers: this.getHeaders(),
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

    try {
      while (true) {
        if (signal?.aborted) break;
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
          } catch { /* skip malformed */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
