import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { PlanTier, getPlanLimits } from "@/lib/plan-limits";

export interface UserPlanData {
  planTier: PlanTier;
  articlesUsed: number;
  articlesLimit: number;
  optimizationsUsed: number;
  optimizationsLimit: number | 'unlimited';
  loading: boolean;
}

export function useUserPlan() {
  const [planData, setPlanData] = useState<UserPlanData>({
    planTier: 'free',
    articlesUsed: 0,
    articlesLimit: 5,
    optimizationsUsed: 0,
    optimizationsLimit: 3,
    loading: true,
  });

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const auth = getFirebaseAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const res = await fetch("/api/user/plan", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const limits = getPlanLimits(data.planTier);
          
          setPlanData({
            planTier: data.planTier,
            articlesUsed: data.articleCountThisPeriod || 0,
            articlesLimit: limits.articlesPerMonth,
            optimizationsUsed: data.optimizationCountThisPeriod || 0,
            optimizationsLimit: limits.aiOptimizationsPerMonth === -1 ? 'unlimited' : limits.aiOptimizationsPerMonth,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch plan data:", error);
        setPlanData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPlanData();
  }, []);

  return planData;
}
