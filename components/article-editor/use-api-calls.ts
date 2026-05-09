"use client";

import { toast } from "sonner";

interface ApiCallsProps {
  articleId: string;
  setLoader: (loading: boolean) => void;
  setOutlineLoading: (loading: boolean) => void;
  setOptLoading: (loading: boolean) => void;
  setSocialLoading: (loading: boolean) => void;
  setArticle: (updater: (prev: any) => any) => void;
  setError: (error: string | null) => void;
}

export function useApiCalls({
  articleId,
  setLoader,
  setOutlineLoading,
  setOptLoading,
  setSocialLoading,
  setArticle,
  setError,
}: ApiCallsProps) {
  const callApi = async (
    endpoint: string,
    setLoading: (loading: boolean) => void,
    onSuccess: (data: any) => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      const data = await res.json();
      onSuccess(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      console.error("API call failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutline = () =>
    callApi("/api/articles/outline", setOutlineLoading, (data) => {
      setArticle((p) => p ? { ...p, outline: data.outline } : null);
      toast.success("Outline generated!");
    });

  const handleOptimize = () =>
    callApi("/api/articles/optimize", setOptLoading, (data) => {
      setArticle((p) => p ? { ...p, optimizations: data.optimizations } : null);
      toast.success("SEO analysis complete!");
    });

  const handleGenerateSocial = () =>
    callApi("/api/articles/social", setSocialLoading, (data) => {
      console.log('[Social] Received data:', data);
      console.log('[Social] socialMedia:', data.socialMedia);
      setArticle((p) => {
        const updated = p ? { ...p, socialMedia: data.socialMedia } : null;
        console.log('[Social] Updated article.socialMedia:', updated?.socialMedia);
        return updated;
      });
      toast.success("Social media posts generated!");
    });

  return {
    handleGenerateOutline,
    handleOptimize,
    handleGenerateSocial,
  };
}
