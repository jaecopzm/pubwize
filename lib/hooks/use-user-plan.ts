import { useState, useEffect } from "react";
import { PlanTier, getPlanLimits } from "@/lib/plan-limits";

export interface UserPlanData {
  planTier: PlanTier;
  articlesUsed: number;
  articlesLimit: number;
  optimizationsUsed: number;
  optimizationsLimit: number | "unlimited";
  loading: boolean;
}

export function useUserPlan() {
  const [planData, setPlanData] = useState<UserPlanData>({
    planTier: "free",
    articlesUsed: 0,
    articlesLimit: 5,
    optimizationsUsed: 0,
    optimizationsLimit: 3,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const limits = getPlanLimits(data.planTier);
        setPlanData({
          planTier: data.planTier,
          articlesUsed: data.articleCountThisPeriod || 0,
          articlesLimit: limits.articlesPerMonth,
          optimizationsUsed: data.optimizationCountThisPeriod || 0,
          optimizationsLimit: limits.aiOptimizationsPerMonth === -1 ? "unlimited" : limits.aiOptimizationsPerMonth,
          loading: false,
        });
      })
      .catch(() => setPlanData((prev) => ({ ...prev, loading: false })));
  }, []);

  return planData;
}
