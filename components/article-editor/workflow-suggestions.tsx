"use client";

import { Lightbulb, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface QualitySuggestion {
  type: "success" | "warning" | "info";
  message: string;
}

interface WorkflowSuggestionsProps {
  step: "brief" | "outline" | "draft" | "seo";
  data?: any;
}

export function WorkflowSuggestions({ step, data }: WorkflowSuggestionsProps) {
  const suggestions = getSuggestionsForStep(step, data);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-semibold">Quality Tips</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg text-xs",
              suggestion.type === "success" && "bg-teal/10 text-teal",
              suggestion.type === "warning" && "bg-gold/10 text-gold",
              suggestion.type === "info" && "bg-lilac/10 text-lilac"
            )}
          >
            {suggestion.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            {suggestion.type === "warning" && <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            {suggestion.type === "info" && <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{suggestion.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSuggestionsForStep(step: string, data?: any): QualitySuggestion[] {
  switch (step) {
    case "brief":
      return [
        {
          type: "info",
          message: "Review the headings and questions. These will structure your outline.",
        },
        {
          type: "success",
          message: "Check competitor insights for content gaps you can fill.",
        },
        {
          type: "warning",
          message: "Verify the search intent matches your goal (informational vs commercial).",
        },
      ];

    case "outline":
      return [
        {
          type: "info",
          message: "Ensure H2/H3 hierarchy is logical. Each section should flow naturally.",
        },
        {
          type: "success",
          message: "Look for FAQ sections - these can win featured snippets.",
        },
        {
          type: "warning",
          message: "Aim for 8-12 sections for comprehensive coverage (1800-2500 words).",
        },
      ];

    case "draft":
      const wordCount = data?.wordCount || 0;
      const targetWordCount = data?.targetWordCount || 2000;
      const diff = Math.abs(wordCount - targetWordCount);
      const withinRange = diff <= targetWordCount * 0.05;

      return [
        {
          type: withinRange ? "success" : "warning",
          message: withinRange
            ? `Perfect! ${wordCount} words is within 5% of your ${targetWordCount} target.`
            : `Word count: ${wordCount}/${targetWordCount}. Aim for ±5% (${Math.floor(targetWordCount * 0.95)}-${Math.ceil(targetWordCount * 1.05)} words).`,
        },
        {
          type: "info",
          message: "Check that the first paragraph hooks readers without keyword stuffing.",
        },
        {
          type: "success",
          message: "Use the AI Improve panel to enhance readability and fix any issues.",
        },
      ];

    case "seo":
      const seoScore = data?.seoScore || 0;
      const readabilityScore = data?.readabilityScore || 0;
      const metaLength = data?.metaDescription?.length || 0;

      return [
        {
          type: seoScore >= 80 ? "success" : "warning",
          message:
            seoScore >= 80
              ? `Excellent SEO score (${seoScore}/100)! Ready to publish.`
              : `SEO score: ${seoScore}/100. Apply suggestions below to improve.`,
        },
        {
          type: metaLength >= 155 && metaLength <= 160 ? "success" : "warning",
          message:
            metaLength >= 155 && metaLength <= 160
              ? `Meta description is perfect (${metaLength} chars).`
              : `Meta description: ${metaLength} chars. Optimal is 155-160 chars.`,
        },
        {
          type: readabilityScore >= 65 ? "success" : "warning",
          message:
            readabilityScore >= 65
              ? `Great readability (${readabilityScore}/100)!`
              : `Readability: ${readabilityScore}/100. Simplify sentences for better engagement.`,
        },
      ];

    default:
      return [];
  }
}
