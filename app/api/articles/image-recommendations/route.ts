import { NextRequest, NextResponse } from "next/server";
import { generateAIJSON } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { validateContent, validateKeyword } from "@/lib/validation";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");

  // 2. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ["content", "keyword"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { content, keyword } = body;

  // 3. Validate content and keyword
  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || "Invalid content");

  const keywordValidation = validateKeyword(keyword);
  assertValid(keywordValidation.valid, keywordValidation.error || "Invalid keyword");

  // 4. Skip if content is too short (save API calls)
  if (content.length < 500) {
    return NextResponse.json({
      recommendations: [],
      message: "Content too short for image recommendations"
    });
  }

  // 5. Generate recommendations
  const systemPrompt = `
You are an expert content strategist analyzing articles for optimal image placement.

Analyze the article and recommend 3-5 sections that would benefit most from images.

Return ONLY a JSON array with this structure:
[
  {
    "section": "section heading or topic",
    "query": "2-3 word search query for Unsplash",
    "reason": "brief reason why this image would help"
  }
]

Focus on sections that:
- Explain complex concepts (diagrams, illustrations)
- Describe products or tools (product photos)
- Show processes or steps (infographics)
- Need visual breaks (hero images, decorative)
- Compare options (comparison images)

The response MUST be valid JSON only. No markdown, no backticks, no prose.
`;

  const userPrompt = `
Target keyword: "${keyword}"

Article content:
${content}

Identify 3-5 sections that would benefit most from images.
`;

  let recommendations: Array<{
    section: string;
    query: string;
    reason: string;
  }>;

  try {
    recommendations = await generateAIJSON({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });
  } catch (aiError) {
    console.error("Image recommendations AI failed:", aiError);
    throw new ExternalServiceError("AI image recommendation service", aiError);
  }

  // 7. Validate structure
  assertValid(Array.isArray(recommendations), "Invalid recommendations format");

  // 8. Limit to 5 recommendations
  const limitedRecommendations = recommendations.slice(0, 5);

  // 9. Return success
  return NextResponse.json({ recommendations: limitedRecommendations });
});