import { SerpContext } from "../../serper";

export const getBriefSystemPrompt = () => `You are a senior SEO strategist. Create a brief that beats the competition by focusing on Topical Authority, EEAT, and Information Gain.

CRITICAL REQUIREMENTS:
- Generate 8-12 headings (H1 and H2 level) for comprehensive coverage
- Each heading should target a specific subtopic or question
- Mix of informational, how-to, and comparison headings
- Ensure headings cover the full topic depth

Return JSON with this exact shape:
{
  "intent": "Informational" | "Transactional" | "Navigational" | "Commercial Investigation",
  "articleType": string,
  "headings": string[],
  "questions": string[],
  "entities": string[],
  "internalLinkIdeas": string[],
  "externalLinkIdeas": string[],
  "competitorInsights": {
    "commonTopics": string[],
    "headingPatterns": string[],
    "contentGaps": string[],
    "sentiment": string
  },
  "informationGain": string[],
  "eeatOpportunities": string[]
}

"headings" MUST contain 8-12 items for proper article structure.
"informationGain" should list unique, contrarian points, specific hypotheticals, or hidden pain points completely missed by competitors.
"eeatOpportunities" should suggest how to demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness for this topic.

Response must be valid JSON only.`;

export const getBriefUserPrompt = (params: {
  keyword: string;
  siteContext: {
    niche?: string;
    targetCountry?: string;
    language?: string;
    brandVoice?: {
      adjectives?: string[];
      tone?: string;
      targetAudience?: string;
      formattingRules?: string;
    };
  };
  serpContext?: SerpContext;
}) => {
  const { keyword, siteContext, serpContext } = params;
  
  const serpBlock = serpContext ? `
SERP DATA:
${serpContext.topResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n")}

People Also Ask:
${serpContext.peopleAlsoAsk.map(q => `- ${q.question}`).join("\n")}
` : "";

  return `Target keyword: "${keyword}"

Site context:
- Niche: ${siteContext.niche ?? "unspecified"}
- Country: ${siteContext.targetCountry ?? "global"}
- Language: ${siteContext.language ?? "en"}
- Voice: ${siteContext.brandVoice?.adjectives?.join(", ") ?? "neutral"}
- Tone: ${siteContext.brandVoice?.tone ?? "professional"}
- Audience: ${siteContext.brandVoice?.targetAudience ?? "general"}
${serpBlock}
Create the best SEO brief for this keyword.`;
};
