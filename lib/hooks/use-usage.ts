"use client";

import { useState, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { PLANS, type PlanTier } from '@/lib/pricing';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/user/usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If user not found (404), sign them out immediately
        if (response.status === 404) {
          await auth.signOut();
          toast.error('Account not found. Please sign up again.');
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch usage');
      }

      const usageData = await response.json();
      setData(usageData);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const canPerformAction = (type: 'articles' | 'aiImprovements' | 'sectionRegenerations'): {
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
  } => {
    if (!data) {
      return { allowed: false, reason: 'Loading...', current: 0, limit: 0 };
    }

    let current: number;
    let limit: number;

    switch (type) {
      case 'articles':
        current = data.usage.articlesUsed;
        limit = data.limits.articlesPerMonth + data.usage.rolloverArticles;
        break;
      case 'aiImprovements':
        current = data.usage.aiImprovementsUsed;
        limit = data.limits.aiImprovementsPerMonth;
        break;
      case 'sectionRegenerations':
        current = data.usage.sectionRegenerationsUsed;
        limit = data.limits.sectionRegenerationsPerMonth;
        break;
    }

    if (current >= limit) {
      const typeName = type === 'articles' 
        ? 'articles' 
        : type === 'aiImprovements'
        ? 'AI improvements'
        : 'section regenerations';

      return {
        allowed: false,
        reason: `You've reached your ${typeName} limit for this month. Upgrade to get more!`,
        current,
        limit,
      };
    }

    return { allowed: true, current, limit };
  };

  return {
    data,
    loading,
    error,
    canPerformAction,
    refetch: fetchUsage,
  };
}
