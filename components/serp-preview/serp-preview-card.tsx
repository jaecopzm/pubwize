"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSERPPreview, type SERPPreviewData } from "@/lib/serp-preview";

interface SERPPreviewCardProps {
  title: string;
  description: string;
  url: string;
}

export function SERPPreviewCard({
  title,
  description,
  url,
}: SERPPreviewCardProps) {
  const preview = React.useMemo(
    () => formatSERPPreview({ title, description, url }),
    [title, description, url]
  );

  // Extract domain from URL
  const domain = React.useMemo(() => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url || "example.com";
    }
  }, [url]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Google Search Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* URL breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{domain}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
            {preview.title || "Untitled"}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {preview.description || "No description provided"}
          </p>

          {/* Truncation warnings */}
          {(preview.isTitleTruncated || preview.isDescriptionTruncated) && (
            <div className="mt-3 pt-3 border-t text-xs text-amber-600 dark:text-amber-500">
              {preview.isTitleTruncated && (
                <div>• Title truncated (over 60 characters)</div>
              )}
              {preview.isDescriptionTruncated && (
                <div>• Description truncated (over 160 characters)</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
