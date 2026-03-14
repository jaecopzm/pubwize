"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ContentSuggestionsProps {
  wordCount: number;
  readabilityScore: number;
  keywordDensity: number;
  hasH1: boolean;
  headingCount: number;
  keywordInTitle: boolean;
  keywordInFirstParagraph: boolean;
}

export function ContentSuggestions({
  wordCount,
  readabilityScore,
  keywordDensity,
  hasH1,
  headingCount,
  keywordInTitle,
  keywordInFirstParagraph,
}: ContentSuggestionsProps) {
  const suggestions = [];

  // Word count suggestions
  if (wordCount < 800) {
    suggestions.push({
      type: "warning",
      message: `Add ${800 - wordCount} more words (aim for 1500+ for better SEO)`,
    });
  } else if (wordCount < 1500) {
    suggestions.push({
      type: "info",
      message: `Good start! Add ${1500 - wordCount} more words for optimal length`,
    });
  } else {
    suggestions.push({
      type: "success",
      message: "Excellent word count for SEO",
    });
  }

  // Readability suggestions
  if (readabilityScore < 50) {
    suggestions.push({
      type: "warning",
      message: "Simplify language - use shorter sentences and common words",
    });
  } else if (readabilityScore < 60) {
    suggestions.push({
      type: "info",
      message: "Readability is okay - consider breaking up long sentences",
    });
  } else {
    suggestions.push({
      type: "success",
      message: "Great readability - easy for readers to understand",
    });
  }

  // Keyword density suggestions
  if (keywordDensity < 0.5) {
    suggestions.push({
      type: "warning",
      message: "Add more keyword mentions (aim for 1.5-2% density)",
    });
  } else if (keywordDensity > 2.5) {
    suggestions.push({
      type: "warning",
      message: "Too many keywords - reduce to avoid looking spammy",
    });
  } else if (keywordDensity >= 1.5 && keywordDensity <= 2.0) {
    suggestions.push({
      type: "success",
      message: "Perfect keyword density for SEO",
    });
  } else {
    suggestions.push({
      type: "info",
      message: "Keyword density is acceptable - aim for 1.5-2% for best results",
    });
  }

  // Structure suggestions
  if (!hasH1) {
    suggestions.push({
      type: "warning",
      message: "Add a main title (H1) at the top of your article",
    });
  }

  if (!keywordInTitle) {
    suggestions.push({
      type: "warning",
      message: "Include your target keyword in the title (H1)",
    });
  }

  if (!keywordInFirstParagraph) {
    suggestions.push({
      type: "warning",
      message: "Add keyword to the first paragraph (first 100 words)",
    });
  }

  if (headingCount < 3) {
    suggestions.push({
      type: "info",
      message: `Add ${3 - headingCount} more headings to improve structure`,
    });
  } else if (headingCount >= 5) {
    suggestions.push({
      type: "success",
      message: "Good heading structure for readability",
    });
  }

  return (
    <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm font-semibold font-mono-dm text-text-1 mb-3">
        Content Suggestions
      </h3>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-[10px] sm:text-xs"
          >
            {suggestion.type === "success" && (
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal shrink-0 mt-0.5" />
            )}
            {suggestion.type === "warning" && (
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold shrink-0 mt-0.5" />
            )}
            {suggestion.type === "info" && (
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-3 shrink-0 mt-0.5" />
            )}
            <span className="text-text-2 leading-relaxed">{suggestion.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
