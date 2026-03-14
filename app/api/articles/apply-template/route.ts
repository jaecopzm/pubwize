import { NextRequest, NextResponse } from "next/server";
import { generateAIJSON } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { validateKeyword } from "@/lib/validation";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");

  // 2. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["templateId", "keyword", "structure"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { templateId, keyword, structure } = body;

  // 3. Validate keyword
  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 4. Validate structure
  assertValid(Array.isArray(structure) && structure.length > 0, "Invalid template structure");

  // 5. Generate outline
  const systemPrompt = `You are an expert SEO content strategist.

Create a detailed article outline based on the provided template structure.

For each section, provide:
1. A specific, keyword-optimized heading (replace placeholders with actual content related to the keyword)
2. Brief notes on what to cover in that section

Return JSON only with this structure:
{
  "sections": [
    {
      "heading": "specific heading with keyword where appropriate",
      "notes": "what to cover in this section"
    }
  ]
}

Make the headings specific to the keyword and actionable. Replace any placeholders like [Product], [Topic], [Number] with actual content.

The response MUST be valid JSON only. No markdown, no backticks, no prose.`;

  const userPrompt = `Target keyword: "${keyword}"
Template: ${templateId}

Template structure:
${structure.map((section: string, i: number) => `${i + 1}. ${section}`).join('\n')}`;

  let outline: {
    sections: Array<{
      heading: string;
      notes: string;
    }>;
  };

  try {
    outline = await generateAIJSON({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });
  } catch (aiError) {
    console.error("Template application AI failed:", aiError);
    throw new ExternalServiceError("AI template service", aiError);
  }

  // 7. Validate structure
  assertValid(outline.sections && Array.isArray(outline.sections), "Invalid outline structure");

  // 8. Return success
  return NextResponse.json({ outline });
});