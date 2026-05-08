import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseProvider } from "./base";
import { AIRequest, AIResponse } from "../types";
import { MODELS } from "../config";

export class GeminiProvider extends BaseProvider {
  name = 'gemini' as const;

  async generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    if (signal?.aborted) throw new Error("Request aborted before Gemini call");

    const client = new GoogleGenerativeAI(apiKey);
    const modelName = request.expectJSON ? MODELS.gemini.json : MODELS.gemini.draft;
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      }
    });

    const prompt = `${request.systemPrompt}\n\n${request.userPrompt}`;

    // Wrap in a race against the abort signal
    const generatePromise = model.generateContent(prompt);
    const result = signal
      ? await Promise.race([
          generatePromise,
          new Promise<never>((_, reject) => {
            signal.addEventListener("abort", () => reject(new Error("Gemini request timed out")), { once: true });
          })
        ])
      : await generatePromise;

    const content = this.cleanContent(result.response.text());
    if (!content) throw new Error("Gemini returned empty content");

    return { content, provider: 'gemini', model: modelName };
  }

  async *stream(request: AIRequest, signal?: AbortSignal): AsyncGenerator<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const client = new GoogleGenerativeAI(apiKey);
    const modelName = request.expectJSON ? MODELS.gemini.json : MODELS.gemini.draft;
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      }
    });

    const prompt = `${request.systemPrompt}\n\n${request.userPrompt}`;
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      const text = chunk.text();
      if (text) yield text;
    }
  }
}
