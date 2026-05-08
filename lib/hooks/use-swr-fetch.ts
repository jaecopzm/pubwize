import useSWR, { SWRConfiguration } from "swr";
import { toast } from "sonner";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  keepPreviousData: true,
};

async function fetcher(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("API request failed");
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export function useArticles() {
  const { data, error, isLoading, mutate } = useSWR("/api/articles", fetcher, {
    ...swrConfig,
    refreshInterval: 30000,
  });
  return { articles: data?.articles || [], isLoading, isError: error, mutate };
}

export function useArticle(articleId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    articleId ? `/api/articles/${articleId}` : null,
    fetcher,
    swrConfig
  );
  return { article: data, isLoading, isError: error, mutate };
}

export function useSites() {
  const { data, error, isLoading, mutate } = useSWR("/api/sites", fetcher, swrConfig);
  return { sites: data?.sites || [], isLoading, isError: error, mutate };
}

export function useUserPlan() {
  const { data, error, isLoading, mutate } = useSWR("/api/user/plan", fetcher, {
    ...swrConfig,
    refreshInterval: 60000,
  });
  return {
    plan: data?.plan || "free",
    usage: data?.usage || { articlesGenerated: 0, limit: 5 },
    periodEnd: data?.periodEnd,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCalendarEvents(year: number, month: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendar?year=${year}&month=${month}`,
    fetcher,
    swrConfig
  );
  return { events: data?.events || [], isLoading, isError: error, mutate };
}

export function useWordPressSites() {
  const { data, error, isLoading, mutate } = useSWR("/api/wordpress/sites", fetcher, swrConfig);
  return { sites: data?.sites || [], isLoading, isError: error, mutate };
}

export function prefetchArticles() { return fetcher("/api/articles"); }
export function prefetchSites() { return fetcher("/api/sites"); }
export function prefetchUserPlan() { return fetcher("/api/user/plan"); }
