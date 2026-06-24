"use client";

import { useEffect } from "react";

export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch("/api/blog/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {});
  }, [articleId]);

  return null;
}
