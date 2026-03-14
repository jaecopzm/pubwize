/**
 * SERP Preview Utilities
 * Client-side utilities for Google search result preview
 */

export interface SERPPreviewData {
  title: string;
  description: string;
  url: string;
}

export interface SERPCharacterCounts {
  title: number;
  description: number;
}

export const SERP_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160,
} as const;

/**
 * Truncate text at specified character limit with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Get character counts for title and description
 */
export function getCharacterCounts(
  title: string,
  description: string
): SERPCharacterCounts {
  return {
    title: title?.length || 0,
    description: description?.length || 0,
  };
}

/**
 * Check if text exceeds the limit
 */
export function exceedsLimit(text: string, limit: number): boolean {
  return (text?.length || 0) > limit;
}

/**
 * Get status color for character count
 * green: within limit, yellow: near limit, red: over limit
 */
export function getCountStatus(
  count: number,
  limit: number
): "good" | "warning" | "error" {
  if (count > limit) return "error";
  if (count > limit * 0.9) return "warning";
  return "good";
}

/**
 * Format SERP preview data with truncation
 */
export function formatSERPPreview(data: SERPPreviewData): {
  title: string;
  description: string;
  url: string;
  isTitleTruncated: boolean;
  isDescriptionTruncated: boolean;
} {
  const title = data.title || "";
  const description = data.description || "";

  return {
    title: truncateText(title, SERP_LIMITS.TITLE_MAX),
    description: truncateText(description, SERP_LIMITS.DESCRIPTION_MAX),
    url: data.url || "",
    isTitleTruncated: title.length > SERP_LIMITS.TITLE_MAX,
    isDescriptionTruncated: description.length > SERP_LIMITS.DESCRIPTION_MAX,
  };
}
