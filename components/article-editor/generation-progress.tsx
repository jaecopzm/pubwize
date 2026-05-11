"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const PHASE_LABELS: Record<string, string> = {
  brief: "Generating brief…",
  outline: "Building outline…",
  draft: "Writing draft…",
  seo: "Optimizing SEO…",
};

interface GenerationProgressProps {
  phase: "brief" | "outline" | "draft" | "seo";
  thinkingText?: string;
  /** 0-100 */
  progress?: number;
  estimatedSeconds?: number;
}

export function GenerationProgress({
  phase,
  thinkingText,
  progress,
}: GenerationProgressProps) {
  const label =
    thinkingText?.trim().split("\n").pop() || PHASE_LABELS[phase] || "Working…";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5"
    >
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />

      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {/* Indeterminate progress track */}
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full w-1/3 rounded-full bg-primary/60"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      {progress != null && (
        <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
          {Math.round(progress)}%
        </span>
      )}
    </motion.div>
  );
}
