"use client";

import * as React from "react";
import { getCountStatus } from "@/lib/serp-preview";
import { cn } from "@/lib/utils";

interface SERPCharacterCounterProps {
  count: number;
  limit: number;
  label: string;
}

export function SERPCharacterCounter({
  count,
  limit,
  label,
}: SERPCharacterCounterProps) {
  const status = getCountStatus(count, limit);

  const statusColors = {
    good: "text-green-600 dark:text-green-500",
    warning: "text-amber-600 dark:text-amber-500",
    error: "text-red-600 dark:text-red-500",
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums transition-colors",
          statusColors[status]
        )}
      >
        {count} / {limit}
      </span>
    </div>
  );
}
