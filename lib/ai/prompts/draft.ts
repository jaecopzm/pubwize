import { OutlineData, SiteBrandVoice } from "../types";

type ExternalSource = {
  title: string;
  url: string;
  snippet?: string;
};

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

SOURCING & LINKS (MANDATORY):
- Add external links to credible sources in-context where they support factual claims.
- You MUST NOT invent URLs. Only link to URLs provided in the user message under "ALLOWED EXTERNAL SOURCES".
- When referencing a source, use normal Markdown links like: ...([source](https://example.com))...
- Include a final "## Sources" section listing ONLY the sources you actually used (each as a Markdown link).

IMAGES (MANDATORY):
- Insert 5-8 image placeholders throughout the article as their own standalone paragraph.
- Placeholder format MUST be exactly: [IMAGE_SUGGESTION: <2-6 word query>]
- Put one near the top (after the intro), then place others under sections where a visual would help (tools, comparisons, step-by-step, diagrams).
- DO NOT output actual image URLs; only placeholders. These placeholders will be replaced later by an image plugin.

CRITICAL KEYWORD & SEO REQUIREMENTS:
- Target keyword: "${keyword}"
- MUST appear in: H1 title, at least 2-3 subheadings, first 100 words, last paragraph
- Target density: 1-1.5% (natural placement, not forced)
- Use semantic variations and related entities naturally throughout
- Include specific data, statistics, and examples to demonstrate expertise
- Add FAQ section if relevant (use ### FAQ format with Q&A pairs)
- Mention real tools, brands, or resources when relevant for authority

E-E-A-T SIGNALS TO INCLUDE:
- Personal experience indicators ("In my experience...", "I've found that...")
- Specific examples with numbers and outcomes
- Acknowledge limitations and edge cases
- Reference industry standards or best practices
- Use "we" and "you" to create connection

FEATURED SNIPPET OPTIMIZATION:
- For "what is" queries: Start with a clear 40-60 word definition
- For "how to" queries: Use numbered steps with clear action verbs
- For comparison queries: Use tables or clear comparison sections

Return ONLY the article content as clean Markdown.${brandVoice}`;
};

export const getDraftUserPrompt = (params: {
  outline: OutlineData;
  keyword: string;
  tone: string;
  targetWords: number;
  lsiKeywords?: string[];
  internalLinkArticles?: Array<{ keyword: string; publishedUrl?: string | null }> | null;
  externalSources?: ExternalSource[] | null;
}) => {
  const { outline, keyword, tone, targetWords, lsiKeywords, internalLinkArticles, externalSources } = params;
  
  const internalLinksBlock = (internalLinkArticles && internalLinkArticles.length > 0)
    ? '\n\nINTERNAL LINK OPPORTUNITIES:\n' +
    internalLinkArticles
      .filter(a => a.publishedUrl)
      .map(a => `- "${a.keyword}" -> ${a.publishedUrl}`)
      .join('\n')
    : '';

  const externalSourcesBlock = (externalSources && externalSources.length > 0)
    ? '\n\nALLOWED EXTERNAL SOURCES (DO NOT INVENT URLS):\n' +
      externalSources
        .filter(s => s?.title && s?.url)
        .slice(0, 12)
        .map((s, i) => `${i + 1}. ${s.title}\n   ${s.url}${s.snippet ? `\n   ${s.snippet}` : ""}`)
        .join('\n')
    : '';

  return `Target keyword: "${keyword}"
Tone: ${tone}

🚨 CRITICAL WORD COUNT REQUIREMENT - YOU WILL BE PENALIZED FOR NOT MEETING THIS:
- EXACT TARGET: ${targetWords} words
- ABSOLUTE MINIMUM: ${Math.floor(targetWords * 0.95)} words - ANYTHING LESS IS UNACCEPTABLE
- ABSOLUTE MAXIMUM: ${Math.ceil(targetWords * 1.05)} words - DO NOT EXCEED THIS
- Per section budget: ~${Math.floor(targetWords / outline.sections.length)} words (${outline.sections.length} sections)
- STOP WRITING IMMEDIATELY if you reach ${Math.ceil(targetWords * 1.05)} words
- COUNT YOUR WORDS AS YOU WRITE - This is your PRIMARY success metric

Outline: ${JSON.stringify(outline, null, 2)}
${internalLinksBlock}
${externalSourcesBlock}

MANDATORY EXECUTION STEPS (FOLLOW EXACTLY):
1. Introduction: Write ${Math.floor(targetWords * 0.1)} words - NO keyword in first paragraph
2. For EACH section in outline: Write ${Math.floor(targetWords / outline.sections.length)} words with depth and examples
3. Conclusion: Write ${Math.floor(targetWords * 0.08)} words with actionable takeaway
4. BEFORE FINISHING: Count your total words - you MUST have AT LEAST ${Math.floor(targetWords * 0.95)} words

LSI Keywords to include naturally: ${lsiKeywords?.join(', ') || 'none'}

Write the complete ${targetWords}-word article now. Remember: ${Math.floor(targetWords * 0.95)}-${Math.ceil(targetWords * 1.05)} words is MANDATORY.`;
};
