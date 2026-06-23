"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSERPPreview } from "@/lib/serp-preview";

interface SERPPreviewCardProps {
  title: string;
  description: string;
  url: string;
  featuredImage?: string | null;
  keyword?: string;
}

export function SERPPreviewCard({
  title,
  description,
  url,
  featuredImage,
}: SERPPreviewCardProps) {
  const preview = React.useMemo(
    () => formatSERPPreview({ title, description, url }),
    [title, description, url]
  );

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
        <div className="rounded-lg border bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              {/* URL breadcrumb with favicon */}
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 text-[8px] font-bold text-neutral-500">
                  {domain.charAt(0).toUpperCase()}
                </div>
                <span className="text-[#006621] dark:text-[#8ab4f8]/80">
                  {domain}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug">
                {preview.title || "Untitled"}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#545454] dark:text-[#bdc1c6] leading-snug">
                {preview.description || "No description provided"}
              </p>
            </div>

            {/* Featured image thumbnail */}
            {featuredImage && (
              <div className="shrink-0 mt-1">
                <img
                  src={featuredImage}
                  alt=""
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                />
              </div>
            )}
          </div>

          {/* Truncation warnings */}
          {(preview.isTitleTruncated || preview.isDescriptionTruncated) && (
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 text-xs text-amber-600 dark:text-amber-500">
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
