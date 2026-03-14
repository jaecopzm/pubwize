/**
 * Real-time SEO scoring for content editing
 * Analyzes rendered HTML content, not markdown syntax
 */

export interface SEOScore {
  overall: number; // 0-100
  keyword: KeywordScore;
  readability: ReadabilityScore;
  structure: StructureScore;
  suggestions: string[];
}

export interface KeywordScore {
  score: number;
  density: number;
  count: number;
  inTitle: boolean;
  inFirstParagraph: boolean;
  inHeadings: number;
  optimal: boolean;
}

export interface ReadabilityScore {
  score: number;
  avgSentenceLength: number;
  avgWordLength: number;
  complexWords: number;
}

export interface StructureScore {
  score: number;
  hasH1: boolean;
  headingCount: number;
  paragraphCount: number;
  wordCount: number;
  imageCount: number;
}

/**
 * Convert markdown to plain text for analysis
 */
function markdownToText(markdown: string): string {
  let text = markdown;
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  
  // Remove images but keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove markdown formatting
  text = text.replace(/[*_~`]/g, '');
  
  // Remove heading markers but keep text
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');
  
  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, '');
  
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  
  return text.trim();
}

/**
 * Extract headings from markdown
 */
function extractHeadings(markdown: string): { level: number; text: string }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string }[] = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }
  
  return headings;
}

/**
 * Extract paragraphs from markdown
 */
function extractParagraphs(markdown: string): string[] {
  // Remove code blocks first
  const text = markdown.replace(/```[\s\S]*?```/g, '');
  
  // Split by double newlines
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => {
      // Filter out headings, lists, and empty paragraphs
      return p.length > 0 && 
             !p.startsWith('#') && 
             !p.match(/^[-*+]\s/) &&
             !p.match(/^\d+\.\s/) &&
             !p.match(/^[-*_]{3,}$/);
    });
  
  return paragraphs;
}

/**
 * Count images in markdown
 */
function countImages(markdown: string): number {
  const imageRegex = /!\[.*?\]\(.*?\)/g;
  const matches = markdown.match(imageRegex);
  return matches ? matches.length : 0;
}

/**
 * Calculate comprehensive SEO score for content
 */
export function calculateSEOScore(content: string, keyword: string): SEOScore {
  const keywordScore = analyzeKeywordUsage(content, keyword);
  const readabilityScore = analyzeReadability(content);
  const structureScore = analyzeStructure(content);

  // Calculate overall score (weighted average)
  const overall = Math.round(
    keywordScore.score * 0.4 +
    readabilityScore.score * 0.3 +
    structureScore.score * 0.3
  );

  const suggestions = generateSuggestions(keywordScore, readabilityScore, structureScore, keyword);

  return {
    overall,
    keyword: keywordScore,
    readability: readabilityScore,
    structure: structureScore,
    suggestions,
  };
}

/**
 * Analyze keyword usage and placement
 */
function analyzeKeywordUsage(content: string, keyword: string): KeywordScore {
  // Convert to plain text for accurate word counting
  const plainText = markdownToText(content);
  const lowerKeyword = keyword.toLowerCase();

  // Count keyword occurrences in plain text
  const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
  const matches = plainText.match(regex) || [];
  const count = matches.length;

  // Calculate word count and density from plain text
  const words = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const density = words > 0 ? (count / words) * 100 : 0;

  // Check keyword placement
  const headings = extractHeadings(content);
  const paragraphs = extractParagraphs(content);

  const inTitle = headings.length > 0 && headings[0].level === 1 &&
                  headings[0].text.toLowerCase().includes(lowerKeyword);

  const firstParagraphText = paragraphs.length > 0 ?
    markdownToText(paragraphs[0]).toLowerCase() : '';
  const inFirstParagraph = firstParagraphText.includes(lowerKeyword);

  // Count in headings
  const inHeadings = headings.filter(h =>
    h.text.toLowerCase().includes(lowerKeyword)
  ).length;

  // Optimal density is 1-2%
  const densityOptimal = density >= 0.5 && density <= 2.5;
  const placementOptimal = inTitle && inFirstParagraph && inHeadings > 0;
  const optimal = densityOptimal && placementOptimal && count >= 3;

  // Calculate score
  let score = 0;
  if (count >= 3) score += 30;
  if (inTitle) score += 20;
  if (inFirstParagraph) score += 20;
  if (inHeadings > 0) score += 15;
  if (densityOptimal) score += 15;

  return {
    score: Math.min(score, 100),
    density,
    count,
    inTitle,
    inFirstParagraph,
    inHeadings,
    optimal,
  };
}

/**
 * Analyze readability
 */
function analyzeReadability(content: string): ReadabilityScore {
  // Convert to plain text
  const plainText = markdownToText(content);
  
  // Split into sentences (more accurate)
  const sentences = plainText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Split into words
  const words = plainText
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-zA-Z]/.test(w));
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length 
    : 0;
  
  // Count complex words (3+ syllables, rough estimate based on length)
  const complexWords = words.filter(w => w.length > 12).length;

  // Score based on readability metrics
  let score = 100;
  if (avgSentenceLength > 25) score -= 20;
  if (avgSentenceLength > 30) score -= 10;
  if (avgWordLength > 6) score -= 15;
  if (complexWords > words.length * 0.15) score -= 15;

  return {
    score: Math.max(score, 0),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexWords,
  };
}

/**
 * Analyze content structure
 */
function analyzeStructure(content: string): StructureScore {
  const headings = extractHeadings(content);
  const h1Count = headings.filter(h => h.level === 1).length;
  const paragraphs = extractParagraphs(content);
  const plainText = markdownToText(content);
  const words = plainText.split(/\s+/).filter(w => w.length > 0 && /[a-zA-Z]/.test(w)).length;
  const images = countImages(content);

  let score = 0;
  if (h1Count === 1) score += 20;
  if (headings.length >= 3) score += 20;
  if (paragraphs.length >= 5) score += 20;
  if (words >= 800) score += 20;
  if (words >= 1500) score += 10;
  if (images >= 1) score += 10;

  return {
    score: Math.min(score, 100),
    hasH1: h1Count === 1,
    headingCount: headings.length,
    paragraphCount: paragraphs.length,
    wordCount: words,
    imageCount: images,
  };
}

/**
 * Generate actionable suggestions
 */
function generateSuggestions(
  keyword: KeywordScore,
  readability: ReadabilityScore,
  structure: StructureScore,
  targetKeyword: string
): string[] {
  const suggestions: string[] = [];

  // Keyword suggestions
  if (!keyword.inTitle) {
    suggestions.push(`Add "${targetKeyword}" to your title (H1)`);
  }
  if (!keyword.inFirstParagraph) {
    suggestions.push(`Include "${targetKeyword}" in the first paragraph`);
  }
  if (keyword.inHeadings === 0) {
    suggestions.push(`Use "${targetKeyword}" in at least one subheading`);
  }
  if (keyword.count < 3) {
    suggestions.push(`Increase keyword usage (currently ${keyword.count} times, aim for 5-8)`);
  }
  if (keyword.density > 2.5) {
    suggestions.push(`Reduce keyword density (${keyword.density.toFixed(1)}% is too high, aim for 1-2%)`);
  }

  // Readability suggestions
  if (readability.avgSentenceLength > 25) {
    suggestions.push(`Shorten sentences (avg ${readability.avgSentenceLength} words, aim for <20)`);
  }
  if (readability.complexWords > 20) {
    suggestions.push(`Simplify language (${readability.complexWords} complex words detected)`);
  }

  // Structure suggestions
  if (!structure.hasH1) {
    suggestions.push('Add a single H1 title at the top');
  }
  if (structure.headingCount < 3) {
    suggestions.push(`Add more subheadings (currently ${structure.headingCount}, aim for 5+)`);
  }
  if (structure.wordCount < 800) {
    suggestions.push(`Expand content (${structure.wordCount} words, aim for 1500+)`);
  }
  if (structure.imageCount === 0) {
    suggestions.push('Add at least one image to improve engagement');
  }

  return suggestions.slice(0, 5); // Top 5 suggestions
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Get score background color
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30';
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-red-500/10 border-red-500/30';
}
