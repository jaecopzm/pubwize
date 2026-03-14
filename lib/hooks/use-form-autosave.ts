"use client";

import { useState, useEffect, useCallback } from "react";

interface FormState {
  keyword: string;
  siteId: string;
}

const STORAGE_KEY = "pubwize_new_article_draft";
const AUTOSAVE_DELAY = 1000; // 1 second

export function useFormAutosave() {
  const [formState, setFormState] = useState<FormState>({ keyword: "", siteId: "" });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormState(parsed.state);
        setLastSaved(new Date(parsed.timestamp));
      }
    } catch (error) {
      console.error("Failed to load autosaved form:", error);
    }
  }, []);

  // Autosave with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formState.keyword || formState.siteId) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              state: formState,
              timestamp: new Date().toISOString(),
            })
          );
          setLastSaved(new Date());
        } catch (error) {
          console.error("Failed to autosave form:", error);
        }
      }
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [formState]);

  const updateForm = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setFormState({ keyword: "", siteId: "" });
      setLastSaved(null);
    } catch (error) {
      console.error("Failed to clear autosaved form:", error);
    }
  }, []);

  return { formState, updateForm, clearSaved, lastSaved };
}
