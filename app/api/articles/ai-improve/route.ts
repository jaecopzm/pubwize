import { NextRequest, NextResponse } from "next/server";
import { generateAIStream, aiUserContext } from "@/lib/ai-providers";
import { logger } from "@/lib/logger";

import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { validateContent, validateKeyword } from "@/lib/validation";

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Check usage quota
  
  const usageCheck = await canPerformAction(uid, "aiImprovements");

  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || "AI improvement limit reached",
      usageCheck.current || 0,
      usageCheck.limit || 0,
      "aiImprovements"
    );
  }

  // 3. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["content", "keyword", "improvementType"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { content, keyword, improvementType } = body;

  // 5. Validate content and keyword
  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || "Invalid content");

  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 6. Build prompts based on improvement type
  let systemPrompt = "";
  let userPrompt = "";

  switch (improvementType) {
    case "rewrite":
      systemPrompt = `You are an expert content writer.

Rewrite the following text to say the same thing in a completely fresh way. Different sentence structure, different word choices, same meaning and facts.

Keep it the same length. Return ONLY the rewritten text with no explanation.`;
      userPrompt = `Target keyword: "${keyword}"\n\nText to rewrite:\n${content}`;
      break;

    case "shorten":
      systemPrompt = `You are a professional editor specializing in concise writing.

Shorten the following text to roughly half its length while keeping all the key information and meaning. Cut filler words, redundant phrases, and unnecessary qualifiers.

Return ONLY the shortened text with no explanation.`;
      userPrompt = `Text to shorten:\n${content}`;
      break;

    case "expand":
      systemPrompt = `You are a professional content writer specializing in detailed, practical content.

Expand this text with more detail, examples, and practical information.

Add:
- Real-world examples
- Practical tips and actionable advice
- More detailed explanations

Keep sentences short (15-20 words) and maintain easy readability.

Return ONLY the expanded content.`;
      userPrompt = `Target keyword: "${keyword}"\n\nCurrent content:\n${content}`;
      break;

    case "formal":
      systemPrompt = `You are a professional content writer.

Rewrite the following text in a formal, professional tone. Use precise vocabulary, complete sentences, and an authoritative voice.

Return ONLY the rewritten text with no explanation.`;
      userPrompt = `Text to formalize:\n${content}`;
      break;

    case "casual":
      systemPrompt = `You are a friendly content writer.

Rewrite the following text in a casual, conversational tone. Use simple language, contractions, and a friendly voice as if talking to a friend.

Return ONLY the rewritten text with no explanation.`;
      userPrompt = `Text to casualize:\n${content}`;
      break;

    default:
      assertValid(false, "Invalid improvement type");
  }

  // 7. Stream improved content using Groq
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const generator = aiUserContext.run(uid, () => generateAIStream({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 4096,
        taskType: 'draft',
      }));

      for await (const chunk of generator) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

      // Increment usage after successful generation
      await incrementUsage(uid, "aiImprovements");

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
    } catch (err) {
      logger.error("AI improvement streaming failed", err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "AI improvement failed. Please try again." })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
});