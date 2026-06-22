import type { BriefData, OutlineData, DraftData, OptimizationData, ArticleSettings } from "./types";

export function asBrief(v: unknown): BriefData | null { return v as BriefData | null; }
export function asOutline(v: unknown): OutlineData | null { return v as OutlineData | null; }
export function asDraft(v: unknown): DraftData | null { return v as DraftData | null; }
export function asOptimizations(v: unknown): OptimizationData | null { return v as OptimizationData | null; }
export function asSettings(v: unknown): ArticleSettings { return (v || {}) as ArticleSettings; }
export function asFeaturedImage(v: unknown): { url: string; photographer: string; photographerUrl: string; unsplashId: string } | null {
  return v as { url: string; photographer: string; photographerUrl: string; unsplashId: string } | null;
}
