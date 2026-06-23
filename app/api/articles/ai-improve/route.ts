import { NextRequest, NextResponse } from "next/server";
import { generateAIStream, aiUserContext } from "@/lib/ai-providers";
import { logger } from "@/lib/logger";

import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { validateContent, validateKeyword } from "@/lib/validation";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || "Invalid content");

  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // Estimate word count to constrain output
  const originalWordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

  // 4. Build prompts per improvement type — all constrained to return ONLY the improved text
  let systemPrompt = "";
  let userPrompt = "";
  let maxTokens = 2000;

  switch (improvementType) {
    case "rewrite":
      systemPrompt = `You are a precise content editor.

Rewrite the provided text with:
- Different sentence structure and word choices
- Same meaning, facts, and information — nothing added or removed
- Same approximate length (${originalWordCount} words ±10%)
- Same markdown formatting (bold, italics, lists, headings) preserved

Return ONLY the rewritten text. No introduction, no explanation.`;
      userPrompt = `Target keyword: "${keyword}"\n\nText to rewrite:\n${content}`;
      maxTokens = Math.ceil(originalWordCount * 2);
      break;

    case "shorten":
      systemPrompt = `You are a professional editor specializing in concise writing.

Shorten the provided text to roughly 60% of its original length (${Math.ceil(originalWordCount * 0.6)} words) while keeping:
- All key information and facts
- The original tone
- Any markdown formatting (bold, lists, headings)

Cut filler words, redundant phrases, and unnecessary qualifiers. Do NOT cut any headings.

Return ONLY the shortened text. No introduction, no explanation.`;
      userPrompt = `Text to shorten:\n${content}`;
      maxTokens = Math.ceil(originalWordCount * 1.5);
      break;

    case "expand":
      systemPrompt = `You are a professional content writer.

Expand the provided text to roughly 160% of its original length (${Math.ceil(originalWordCount * 1.6)} words) by adding:
- Real-world examples and scenarios
- Practical tips and actionable advice  
- More detailed explanations of key points

Keep sentences short (15-20 words) and maintain the original tone and markdown formatting.

Return ONLY the expanded text. No introduction, no explanation.`;
      userPrompt = `Target keyword: "${keyword}"\n\nText to expand:\n${content}`;
      maxTokens = Math.ceil(originalWordCount * 3);
      break;

    case "formal":
      systemPrompt = `You are a professional editor.

Rewrite the provided text in a formal, authoritative tone using:
- Precise vocabulary and complete sentences
- No contractions, no slang
- Same length (${originalWordCount} words ±10%) and same markdown formatting

Return ONLY the rewritten text. No introduction, no explanation.`;
      userPrompt = `Text to formalize:\n${content}`;
      maxTokens = Math.ceil(originalWordCount * 2);
      break;

    case "casual":
      systemPrompt = `You are a friendly content writer.

Rewrite the provided text in a casual, conversational tone using:
- Simple language, contractions, and a friendly voice
- Same length (${originalWordCount} words ±10%) and same markdown formatting

Return ONLY the rewritten text. No introduction, no explanation.`;
      userPrompt = `Text to make casual:\n${content}`;
      maxTokens = Math.ceil(originalWordCount * 2);
      break;

    default:
      assertValid(false, "Invalid improvement type");
  }

  // 5. Stream improved content
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const generator = aiUserContext.run(uid, () => generateAIStream({
        systemPrompt,
        userPrompt,
        temperature: 0.4, // Precise enough to not hallucinate, creative enough to vary phrasing
        maxTokens,
        taskType: 'draft',
      }));

      for await (const chunk of generator) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

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