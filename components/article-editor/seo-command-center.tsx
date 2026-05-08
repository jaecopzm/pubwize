"use client";

import { LiveSEOScore } from "./live-seo-score";

interface SEOCommandCenterProps {
  content: string;
  keyword: string;
  targetWordCount: number;
  onUpdate?: (content: string) => void;
}

export function SEOCommandCenter({ content, keyword, targetWordCount, onUpdate }: SEOCommandCenterProps) {
  return (
    <div className="space-y-4">
      <LiveSEOScore content={content} keyword={keyword} onUpdate={onUpdate} />
    </div>
  );
}
