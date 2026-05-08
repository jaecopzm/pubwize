"use client";

import { useState, useEffect } from "react";
import { PLANS, type PlanTier } from "@/lib/pricing";

export interface UsageData {
  plan: PlanTier;
  limits: {
    articlesPerMonth: number;
    aiImprovementsPerMonth: number;
    sectionRegenerationsPerMonth: number;
  };
  usage: {
    articlesUsed: number;
    aiImprovementsUsed: number;
    sectionRegenerationsUsed: number;
    rolloverArticles: number;
    socialGenerationsUsed?: number;
  };
  periodStart: Date;
  periodEnd: Date;
}

export function useUsage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/usage");
      if (!response.ok) throw new Error("Failed to fetch usage");
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsage(); }, []);

  const canPerformAction = (type: "articles" | "aiImprovements" | "sectionRegenerations") => {
    if (!data) return { allowed: false, reason: "Loading...", current: 0, limit: 0 };

    const current =
      type === "articles" ? data.usage.articlesUsed :
      type === "aiImprovements" ? data.usage.aiImprovementsUsed :
      data.usage.sectionRegenerationsUsed;

    const limit =
      type === "articles" ? data.limits.articlesPerMonth + data.usage.rolloverArticles :
      type === "aiImprovements" ? data.limits.aiImprovementsPerMonth :
      data.limits.sectionRegenerationsPerMonth;

    if (current >= limit) {
      return { allowed: false, reason: `You've reached your limit for this month. Upgrade to get more!`, current, limit };
    }
    return { allowed: true, current, limit };
  };

  return { data, loading, error, canPerformAction, refetch: fetchUsage };
}
