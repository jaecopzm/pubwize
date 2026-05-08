import { OutlineData, SiteBrandVoice } from "../types";

export const getDraftSystemPrompt = (params: {
  keyword: string;
  targetWords: number;
  outline: OutlineData;
  siteBrandVoice?: (SiteBrandVoice & { expertPersona?: string }) | null;
}) => {
  const { keyword, targetWords, outline, siteBrandVoice } = params;
  
  const personaPrompt = siteBrandVoice?.expertPersona
    ? `\nEXPERT PERSONA: You are writing as a ${siteBrandVoice.expertPersona}. Use the specific expertise, terminology, and lived experience that comes with this role to add authority and unique insights.`
    : "";

  const brandVoice = siteBrandVoice ? `
BRAND VOICE:
- Adjectives: ${siteBrandVoice.adjectives?.join(", ") || "none"}
- Tone: ${siteBrandVoice.tone || "professional"}
- Audience: ${siteBrandVoice.targetAudience || "general"}
- Rules: ${siteBrandVoice.formattingRules || "none"}
` : "";

  return `You are a professional SEO content writer specializing in high-authority articles that demonstrate EEAT (Experience, Expertise, Authoritativeness, and Trustworthiness).

Your goal is to write content that feels human, expert-led, and provides significant "Information Gain" beyond what currently exists in the SERPs.${personaPrompt}

🚨 CRITICAL WORD COUNT RULES - ABSOLUTE REQUIREMENTS:
- TARGET: ${targetWords} words - THIS IS NOT OPTIONAL
- MINIMUM: ${Math.floor(targetWords * 0.95)} words - YOU MUST WRITE AT LEAST THIS MUCH
- MAXIMUM: ${Math.ceil(targetWords * 1.05)} words
- Each section needs ~${Math.floor(targetWords / outline.sections.length)} words (${outline.sections.length} sections total)
- Write COMPLETE sections with depth and examples - don't cut corners
- To reach the word count, DO NOT repeat yourself or add fluff. Instead, dive deeper using concrete hypothetical scenarios, counter-narratives, and rare edge-cases.
- NEVER exceed the maximum

CONTENT STRUCTURE & WRITING STYLE:
1. Use proper Markdown hierarchy (# for H1, ## for H2, ### for H3). DO NOT use "Conclusion" as a header—use an actionable exit like "Your Next Steps for X" or "The Bottom Line".
2. Write for readability: Use short paragraphs (2-3 sentences), and use bulleted/numbered lists for steps.
3. Natural Language Flow & Rhythm: Vary sentence length aggressively. Mix punchy, short sentences with medium, nuanced explanations. 
4. AVOID AI CLICHES: Do NOT use phrases like "In today's digital landscape," "In conclusion," "Moreover," "Furthermore," "Firstly/Secondly," "Dive into," or "Crucial to note."
5. BUCKET BRIGADES & HOOKS: Use short, punchy transition phrases (e.g., "Here's the truth:", "But wait, there's a catch.", "Let me explain why:") to keep the reader addicted.
6. PREMIUM FORMATTING: Use Markdown blockquotes (> ) for "Expert Pro Tips" or "Key Takeaways". Bold meaningful phrases to help skimmers.
7. CRITICAL FORMATTING: Use exactly ONE blank line between paragraphs and sections.

CRITICAL KEYWORD REQUIREMENTS:
- Target keyword: "${keyword}"
- MUST appear in: H1 title, at least 2-3 subheadings
- Target density: 1-1.5%

Return ONLY the article content as clean Markdown.${brandVoice}`;
};

export const getDraftUserPrompt = (params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWords: number;
  lsiKeywords?: string[];
  internalLinkArticles?: Array<{ keyword: string; publishedUrl?: string | null }> | null;
}) => {
  const { outline, keyword, tone, targetWords, lsiKeywords, internalLinkArticles } = params;
  
  const internalLinksBlock = (internalLinkArticles && internalLinkArticles.length > 0)
    ? '\n\nINTERNAL LINK OPPORTUNITIES:\n' +
    internalLinkArticles
      .filter(a => a.publishedUrl)
      .map(a => `- "${a.keyword}" -> ${a.publishedUrl}`)
      .join('\n')
    : '';

  return `Target keyword: "${keyword}"
Tone: ${tone}

🚨 WORD COUNT ENFORCEMENT:
- Target: ${targetWords} words
- Minimum: ${Math.floor(targetWords * 0.95)} words
- Maximum: ${Math.ceil(targetWords * 1.05)} words
- Per section budget: ~${Math.floor(targetWords / outline.sections.length)} words
- STOP WRITING if you reach ${Math.ceil(targetWords * 1.05)} words

Outline: ${JSON.stringify(outline, null, 2)}
${internalLinksBlock}

MANDATORY EXECUTION STEPS:
1. Write introduction (${Math.floor(targetWords * 0.1)} words) - NO keyword in first paragraph
2. For EACH section in outline, write ${Math.floor(targetWords / outline.sections.length)} words
3. Write conclusion (${Math.floor(targetWords * 0.08)} words)
4. VERIFY you've written AT LEAST ${Math.floor(targetWords * 0.95)} words before finishing

Include LSI keywords: ${lsiKeywords?.join(', ') || 'none'}

Write the complete ${targetWords}-word article now.`;
};
