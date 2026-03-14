"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ReadabilityScores } from "@/lib/readability";
import { cn } from "@/lib/utils";

interface ReadabilityScoreCardProps {
  scores: ReadabilityScores | null;
  wordCount: number;
}

export function ReadabilityScoreCard({
  scores,
  wordCount,
}: ReadabilityScoreCardProps) {
  if (wordCount < 100) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Readability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Insufficient content. Write at least 100 words to see readability
            scores.
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Current: {wordCount} words
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scores) {
    return null;
  }

  const ratingColors = {
    excellent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Readability Analysis
          </CardTitle>
          <Badge className={cn("capitalize", ratingColors[scores.rating])}>
            {scores.rating}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flesch Reading Ease */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reading Ease</span>
            <span className="font-medium">{scores.fleschReadingEase}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                scores.fleschReadingEase >= 70
                  ? "bg-green-500"
                  : scores.fleschReadingEase >= 60
                    ? "bg-blue-500"
                    : scores.fleschReadingEase >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
              )}
              style={{ width: `${scores.fleschReadingEase}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {scores.fleschReadingEase >= 70
              ? "Very easy to read"
              : scores.fleschReadingEase >= 60
                ? "Easy to read"
                : scores.fleschReadingEase >= 50
                  ? "Fairly difficult"
                  : "Difficult to read"}
          </p>
        </div>

        {/* Flesch-Kincaid Grade */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Grade Level</span>
            <span className="font-medium">
              {scores.fleschKincaidGrade}
              {scores.fleschKincaidGrade === 1 ? "st" : scores.fleschKincaidGrade === 2 ? "nd" : scores.fleschKincaidGrade === 3 ? "rd" : "th"} grade
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Readable by {scores.fleschKincaidGrade <= 8 ? "most" : scores.fleschKincaidGrade <= 12 ? "high school" : "college"} readers
          </p>
        </div>

        {/* Hemingway Score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hemingway Score</span>
            <span className="font-medium">{scores.hemingwayScore}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {scores.hemingwayScore <= 6
              ? "Bold and clear"
              : scores.hemingwayScore <= 10
                ? "Good clarity"
                : scores.hemingwayScore <= 14
                  ? "Okay clarity"
                  : "Needs improvement"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
