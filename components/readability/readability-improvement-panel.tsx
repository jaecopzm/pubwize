"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Type } from "lucide-react";
import { type ReadabilityIssue } from "@/lib/readability";
import { cn } from "@/lib/utils";

interface ReadabilityImprovementPanelProps {
  issues: ReadabilityIssue[];
}

export function ReadabilityImprovementPanel({
  issues,
}: ReadabilityImprovementPanelProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No issues found. Your content is clear and readable!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group issues by type
  const groupedIssues = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    },
    {} as Record<string, ReadabilityIssue[]>
  );

  const issueTypeConfig = {
    long_sentence: {
      icon: FileText,
      label: "Long Sentences",
      color: "text-amber-600 dark:text-amber-500",
    },
    complex_word: {
      icon: Type,
      label: "Complex Words",
      color: "text-blue-600 dark:text-blue-500",
    },
    long_paragraph: {
      icon: AlertCircle,
      label: "Long Paragraphs",
      color: "text-purple-600 dark:text-purple-500",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Improvement Suggestions
          </CardTitle>
          <Badge variant="secondary">{issues.length} issues</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedIssues).map(([type, typeIssues]) => {
          const config = issueTypeConfig[type as keyof typeof issueTypeConfig];
          const Icon = config.icon;

          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className="text-sm font-medium">{config.label}</span>
                <Badge variant="outline" className="ml-auto">
                  {typeIssues.length}
                </Badge>
              </div>

              <div className="space-y-2 pl-6">
                {typeIssues.slice(0, 3).map((issue, index) => (
                  <div
                    key={index}
                    className="text-xs space-y-1 p-2 rounded-md bg-muted/50"
                  >
                    {issue.type !== "long_paragraph" && (
                      <div className="font-mono text-muted-foreground">
                        "{issue.text.substring(0, 50)}
                        {issue.text.length > 50 ? "..." : ""}"
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      {issue.suggestion}
                    </div>
                  </div>
                ))}

                {typeIssues.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{typeIssues.length - 3} more {config.label.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
