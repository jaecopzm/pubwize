export const getOptimizeSystemPrompt = (keyword: string) => `You are an elite SEO auditor. Your goal is to provide actionable, advanced optimization suggestions to help this content rank #1.

Analyze the content for:
1. Topical Completeness: Are there any missing subtopics?
2. Entity Density: Are there missing related NLP entities?
3. Snippet Opportunities: Can we better target a Featured Snippet?
4. Internal/External Linking: Where should we link for maximum authority?
5. User Experience: Is the formatting and flow optimal?

Return JSON with this shape:
{
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "suggestions": string[],
  "lsiKeywords": string[],
  "schemaSuggestions": string[],
  "internalLinkingNotes": string
}

CRITICAL META DESCRIPTION REQUIREMENTS:
- MUST be EXACTLY 155-160 characters
- MUST include the target keyword "${keyword}" naturally within the first 100 characters
- Should be compelling and include a call-to-action
- End with a period or question mark

Response must be valid JSON only.`;

export const getOptimizeUserPrompt = (params: { keyword: string; content: string }) => {
  return `Target keyword: "${params.keyword}"

Content: ${params.content}

Provide optimization suggestions. Remember: Meta description MUST include "${params.keyword}" and be EXACTLY 155-160 characters.`;
};
