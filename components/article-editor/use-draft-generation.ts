"use client";

import { useRef } from "react";
import { toast } from "sonner";

interface DraftGenerationProps {
  articleId: string;
  draftContentRef: React.MutableRefObject<string>;
  setDraftLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDraftAccumulated: (content: string) => void;
  setWordCount: (count: number) => void;
  setArticle: (updater: (prev: any) => any) => void;
  setCurrentView: (view: number) => void;
}

export function useDraftGeneration({
  articleId,
  draftContentRef,
  setDraftLoading,
  setError,
  setDraftAccumulated,
  setWordCount,
  setArticle,
  setCurrentView,
}: DraftGenerationProps) {
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleGenerateDraft = async (wordCount: number) => {
    console.log('[Draft Hook] Starting generation, wordCount:', wordCount);
    setDraftLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/articles/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, targetWordCount: wordCount }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Draft generation failed");
      }

      setArticle((p) => p ? { ...p, draft: { content: "", format: "markdown" } } : null);
      setCurrentView(3);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      draftContentRef.current = "";
      let accumulatedRaw = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedRaw += decoder.decode(value, { stream: true });
        const lines = accumulatedRaw.split('\n');
        accumulatedRaw = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data: ")) continue;

          const dataStr = trimmedLine.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) throw new Error(payload.error);
            if (payload.chunk) {
              draftContentRef.current += payload.chunk;
              
              // Batch updates using a timer
              if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
              }
              
              updateTimerRef.current = setTimeout(() => {
                setDraftAccumulated(draftContentRef.current);
                setWordCount(draftContentRef.current.trim().split(/\s+/).length);
              }, 100);
            }
            if (payload.done) {
              console.log('[Draft Hook] Stream done, final content length:', draftContentRef.current.length);
              
              // Clear any pending timer
              if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
                updateTimerRef.current = null;
              }
              
              // Ensure final state is set
              setDraftAccumulated(draftContentRef.current);
              setWordCount(draftContentRef.current.trim().split(/\s+/).length);
              setArticle((p) => p ? { ...p, draft: { content: draftContentRef.current, format: "markdown" } } : null);
              toast.success("Draft generated!");
            }
          } catch (parseErr: any) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err: any) {
      const msg = err.message || "Draft generation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setDraftLoading(false);
    }
  };

  return { handleGenerateDraft };
}
