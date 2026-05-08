import { BriefData } from "../types";

export const getOutlineSystemPrompt = (keyword: string) => `You are an SEO content strategist. Create a detailed outline optimized for Topical Authority and Featured Snippets.

CRITICAL REQUIREMENT:
- The FIRST section (H1) MUST be the article's title.
- The title MUST contain the target keyword: "${keyword}".
- Structure the outline using "Progressive Disclosure": answer the user's most burning question immediately, then dive into advanced nuances later.
- Ensure the outline flow naturally supports emotional "Bucket Brigade" transition sections.

Return JSON with this shape:
{
  "sections": [
    {
      "heading": string,
      "level": 2 | 3,
      "notes": string,
      "answerTarget": string | null,
      "isFaq": boolean
    }
  ],
  "structuralLogic": string
}

"answerTarget" should be a concise 40-60 word answer for a potential Featured Snippet if applicable to that section.
"structuralLogic" explains why this hierarchy satisfies the user intent.

Response must be valid JSON only.`;

export const getOutlineUserPrompt = (params: { brief: BriefData; keyword: string }) => {
  return `Target Keyword: "${params.keyword}"
Brief: ${JSON.stringify(params.brief, null, 2)}

Create a clear, logical outline. Ensure the H1 title is included as the first section and contains the keyword.`;
};
