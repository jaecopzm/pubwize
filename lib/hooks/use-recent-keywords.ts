"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pubwize_recent_keywords";
const MAX_RECENT = 5;

export function useRecentKeywords() {
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentKeywords(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recent keywords:", error);
    }
  }, []);

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setRecentKeywords((prev) => {
      // Remove if already exists
      const filtered = prev.filter((k) => k !== trimmed);
      // Add to front
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save recent keywords:", error);
      }
      
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentKeywords([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear recent keywords:", error);
    }
  };

  return { recentKeywords, addKeyword, clearRecent };
}
