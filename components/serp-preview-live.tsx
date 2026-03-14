"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SerpPreviewProps {
  title: string;
  description: string;
  domain: string;
  keyword: string;
  className?: string;
}

export function SerpPreview({ title, description, domain, keyword, className }: SerpPreviewProps) {
  const [displayUrl, setDisplayUrl] = useState("");

  useEffect(() => {
    // Clean domain for display
    const cleaned = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    setDisplayUrl(cleaned);
  }, [domain]);

  // Highlight keyword in title and description
  const highlightKeyword = (text: string) => {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <strong key={i} className="font-semibold">{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Truncate text
  const truncateTitle = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const truncateDescription = (text: string, maxLength: number = 160) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={cn("rounded-xl border border-border/60 bg-card/50 p-6", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-foreground">Google Search Preview</h3>
      </div>

      {/* Google-style result */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        {/* Breadcrumb */}
        <div className="mb-1 flex items-center gap-1 text-xs">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
            <Globe className="h-3 w-3 text-gray-600" />
          </div>
          <span className="text-gray-600">{displayUrl}</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>

        {/* Title */}
        <h3 className="mb-1 text-xl leading-tight text-[#1a0dab] hover:underline cursor-pointer">
          {highlightKeyword(truncateTitle(title || "Your Article Title"))}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-600">
          {highlightKeyword(truncateDescription(description || "Your meta description will appear here. Make it compelling to increase click-through rates from search results."))}
        </p>
      </div>

      {/* Character counts */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Title:</span>
          <span className={cn(
            "font-medium",
            title.length > 60 ? "text-yellow-400" : "text-green-400"
          )}>
            {title.length}/60
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>Description:</span>
          <span className={cn(
            "font-medium",
            description.length > 160 ? "text-yellow-400" : "text-green-400"
          )}>
            {description.length}/160
          </span>
        </div>
      </div>
    </div>
  );
}
