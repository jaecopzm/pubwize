import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, aiUserContext } from "@/lib/ai-providers";
import { logger } from "@/lib/logger";

import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { validateKeyword } from "@/lib/validation";

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Check usage quota
  
  const usageCheck = await canPerformAction(uid, "sectionRegenerations");

  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || "Section regeneration limit reached",
      usageCheck.current || 0,
      usageCheck.limit || 0,
      "sectionRegenerations"
    );
  }

  // 3. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["sectionHeading", "keyword"], ["sectionContent"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { sectionHeading, sectionContent, keyword } = body;

  // 5. Validate keyword
  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 6. Build prompts
  const systemPrompt = `You are a professional SEO content writer.

Rewrite this section to be better, more engaging, and SEO-optimized.

Requirements:
1. Keep sentences SHORT (15-20 words maximum)
2. Use simple, clear language (8th-grade reading level)
3. Include the keyword naturally 1-2 times
4. Use active voice
5. Add specific examples or practical tips
6. Use bullet points or numbered lists where appropriate
7. Make it engaging and valuable for readers
8. Keep paragraphs short (2-3 sentences)

Return ONLY the rewritten section content as Markdown (no heading, just the content).`;

  const userPrompt = `Target keyword: "${keyword}"
Section heading: ${sectionHeading}

Current content:
${sectionContent || "No content yet - create from scratch"}`;

  // 7. Generate new content
  let newContent: string;
  try {
    newContent = await aiUserContext.run(uid, () => generateAIResponse({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
    }));
  } catch (aiError) {
    logger.error("Section regeneration failed", aiError);
    throw new ExternalServiceError("AI regeneration service", aiError);
  }

  // 8. Increment usage counter
  await incrementUsage(uid, "sectionRegenerations");

  // 9. Return success
  return NextResponse.json({ newContent });
});