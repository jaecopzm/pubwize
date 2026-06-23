"use client";

import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenerateCTAProps {
  onClick: () => void;
  loading: boolean;
  done: boolean;
  label: string;
  doneLabel: string;
  onRegenerate?: () => void;
}

export function GenerateCTA({
  onClick,
  loading,
  done,
  label,
  doneLabel,
  onRegenerate,
}: GenerateCTAProps) {
  if (done)
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold flex-1 text-emerald-600 dark:text-emerald-400"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          </div>
          <span className="truncate tracking-tight uppercase">{doneLabel}</span>
        </motion.div>
        
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 sm:flex-1"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="tracking-tight uppercase">Regenerate</span>
          </button>
        )}
      </div>
    );

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative w-full flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]",
        loading
          ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm"
      )}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="tracking-wider">Generating...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
}
