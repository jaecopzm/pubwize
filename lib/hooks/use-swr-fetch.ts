/**
 * SWR Data Fetching Hooks
 * Optimized data fetching with caching and revalidation
 */

import useSWR, { SWRConfiguration } from 'swr';
import { getFirebaseAuth } from '@/lib/firebase-client';

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  keepPreviousData: true,
};

/**
 * Fetcher with Firebase auth
 */
async function fetcherWithAuth(url: string) {
  const auth = getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = new Error('API request failed');
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Hook for fetching articles
 */
export function useArticles() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/articles',
    fetcherWithAuth,
    {
      ...swrConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    articles: data?.articles || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching single article
 */
export function useArticle(articleId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    articleId ? `/api/articles/${articleId}` : null,
    fetcherWithAuth,
    swrConfig
  );

  return {
    article: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching sites
 */
export function useSites() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/sites',
    fetcherWithAuth,
    swrConfig
  );

  return {
    sites: data?.sites || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching user plan
 */
export function useUserPlan() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/user/plan',
    fetcherWithAuth,
    {
      ...swrConfig,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    plan: data?.plan || 'free',
    usage: data?.usage || { articlesGenerated: 0, limit: 5 },
    periodEnd: data?.periodEnd,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching calendar events
 */
export function useCalendarEvents(year: number, month: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendar?year=${year}&month=${month}`,
    fetcherWithAuth,
    swrConfig
  );

  return {
    events: data?.events || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching WordPress sites
 */
export function useWordPressSites() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/wordpress/sites',
    fetcherWithAuth,
    swrConfig
  );

  return {
    sites: data?.sites || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Prefetch data for faster navigation
 */
export function prefetchArticles() {
  return fetcherWithAuth('/api/articles');
}

export function prefetchSites() {
  return fetcherWithAuth('/api/sites');
}

export function prefetchUserPlan() {
  return fetcherWithAuth('/api/user/plan');
}
