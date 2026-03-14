/**
 * Readability Analysis Utilities
 * Client-side readability scoring using Flesch-Kincaid and Hemingway formulas
 */

import { syllable } from "syllable";

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  hemingwayScore: number;
  rating: "poor" | "fair" | "good" | "excellent";
}

export interface ReadabilityIssue {
  type: "long_sentence" | "complex_word" | "long_paragraph";
  location: { start: number; end: number };
  text: string;
  suggestion: string;
}

const MIN_WORD_COUNT = 100;

/**
 * Strip markdown syntax from text
 */
function stripMarkdown(markdown: string): string {
  let text = markdown;
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  
  // Remove images but keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove markdown formatting
  text = text.replace(/[*_~`#]/g, '');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');
  
  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, '');
  
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  return text.trim();
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  // Match sentence endings: . ! ? followed by space or end of string
  const sentences = text.match(/[.!?]+(\s|$)/g);
  return sentences ? sentences.length : 1;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text.trim().match(/\b\w+\b/g);
  return words ? words.length : 0;
}

/**
 * Count syllables in text
 */
function countSyllables(text: string): number {
  return syllable(text);
}

/**
 * Calculate Flesch Reading Ease score
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 * Score: 0-100 (higher is easier)
 */
function calculateFleschReadingEase(
  words: number,
  sentences: number,
  syllables: number
): number {
  if (words === 0 || sentences === 0) return 0;
  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 * Score: US grade level (e.g., 8 = 8th grade)
 */
function calculateFleschKincaidGrade(
  words: number,
  sentences: number,
  syllables: number
): number {
  if (words === 0 || sentences === 0) return 0;
  const grade =
    0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Calculate Hemingway readability score
 * Simplified formula based on sentence length and complex words
 */
function calculateHemingwayScore(
  words: number,
  sentences: number,
  complexWords: number
): number {
  if (words === 0 || sentences === 0) return 0;
  const avgSentenceLength = words / sentences;
  const complexWordRatio = complexWords / words;

  // Hemingway score approximation (lower is better, 0-20 scale)
  const score = avgSentenceLength * 0.4 + complexWordRatio * 100;
  return Math.max(0, Math.min(20, Math.round(score * 10) / 10));
}

/**
 * Count complex words (3+ syllables)
 */
function countComplexWords(text: string): number {
  const words = text.match(/\b\w+\b/g) || [];
  return words.filter((word) => syllable(word) >= 3).length;
}

/**
 * Get rating based on Flesch Reading Ease score
 */
function getRating(fleschScore: number): "poor" | "fair" | "good" | "excellent" {
  if (fleschScore >= 70) return "excellent";
  if (fleschScore >= 60) return "good";
  if (fleschScore >= 50) return "fair";
  return "poor";
}

/**
 * Calculate all readability scores for given text
 * Returns null if text is under minimum word count
 */
export function calculateReadabilityScores(
  text: string
): ReadabilityScores | null {
  if (!text) return null;

  // Strip markdown first to get accurate counts
  const plainText = stripMarkdown(text);

  const words = countWords(plainText);
  if (words < MIN_WORD_COUNT) return null;

  const sentences = countSentences(plainText);
  const syllables = countSyllables(plainText);
  const complexWords = countComplexWords(plainText);

  const fleschReadingEase = calculateFleschReadingEase(
    words,
    sentences,
    syllables
  );
  const fleschKincaidGrade = calculateFleschKincaidGrade(
    words,
    sentences,
    syllables
  );
  const hemingwayScore = calculateHemingwayScore(
    words,
    sentences,
    complexWords
  );

  return {
    fleschReadingEase,
    fleschKincaidGrade,
    hemingwayScore,
    rating: getRating(fleschReadingEase),
  };
}

/**
 * Detect readability issues in text
 */
export function detectReadabilityIssues(text: string): ReadabilityIssue[] {
  if (!text) return [];

  // Strip markdown first
  const plainText = stripMarkdown(text);
  const issues: ReadabilityIssue[] = [];

  // Split into sentences
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences: string[] = plainText.match(sentenceRegex) || [];

  let currentIndex = 0;
  sentences.forEach((sentence) => {
    const start = plainText.indexOf(sentence, currentIndex);
    const end = start + sentence.length;
    currentIndex = end;

    const words: string[] = sentence.match(/\b\w+\b/g) || [];

    // Check for long sentences (>25 words)
    if (words.length > 25) {
      issues.push({
        type: "long_sentence",
        location: { start, end },
        text: sentence.trim(),
        suggestion: `This sentence has ${words.length} words. Consider breaking it into shorter sentences (aim for 15-20 words).`,
      });
    }

    // Check for complex words (>3 syllables)
    words.forEach((word) => {
      if (syllable(word) > 3) {
        const wordStart = plainText.indexOf(word, start);
        const wordEnd = wordStart + word.length;
        issues.push({
          type: "complex_word",
          location: { start: wordStart, end: wordEnd },
          text: word,
          suggestion: `"${word}" has ${syllable(word)} syllables. Consider using a simpler alternative.`,
        });
      }
    });
  });

  // Check for long paragraphs (>5 sentences)
  const paragraphs = plainText.split(/\n\n+/);
  let paragraphIndex = 0;
  paragraphs.forEach((paragraph) => {
    const start = plainText.indexOf(paragraph, paragraphIndex);
    const end = start + paragraph.length;
    paragraphIndex = end;

    const paragraphSentences = paragraph.match(sentenceRegex) || [];
    if (paragraphSentences.length > 5) {
      issues.push({
        type: "long_paragraph",
        location: { start, end },
        text: paragraph.substring(0, 100) + "...",
        suggestion: `This paragraph has ${paragraphSentences.length} sentences. Consider breaking it into smaller paragraphs (aim for 3-4 sentences).`,
      });
    }
  });

  return issues;
}
