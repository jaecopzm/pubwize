import { AIRequest, AIResponse } from "../types";

/**
 * Common interface for all AI providers.
 */
export interface AIProviderInstance {
  name: string;
  generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse>;
  stream?(request: AIRequest, signal?: AbortSignal): AsyncGenerator<string>;
}

/**
 * Abstract base class with shared helpers.
 */
export abstract class BaseProvider implements AIProviderInstance {
  abstract name: string;
  abstract generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse>;

  async *stream(request: AIRequest, signal?: AbortSignal): AsyncGenerator<string> {
    throw new Error(`Streaming not implemented for provider: ${this.name}`);
  }

  protected cleanContent(content: string): string {
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }
    return cleaned;
  }
}
