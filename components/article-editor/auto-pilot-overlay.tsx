"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Loader2, X, ChevronRight, Sparkles } from "lucide-react";
import { GenerationProgress } from "./generation-progress";
import { cn } from "@/lib/utils";

interface AutoPilotOverlayProps {
  isRunning: boolean;
  phase: "brief" | "outline" | "draft" | "seo" | null;
  progress: number;
  wordCount: number;
  targetWordCount: number;
  thinkingText?: string;
  onCancel: () => void;
  phasesCompleted: {
    brief: boolean;
    outline: boolean;
    draft: boolean;
    seo: boolean;
  };
}

export function AutoPilotOverlay({
  isRunning,
  phase,
  progress,
  wordCount,
  targetWordCount,
  thinkingText,
  onCancel,
  phasesCompleted,
}: AutoPilotOverlayProps) {
  if (!isRunning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-[280px] max-w-[calc(100vw-48px)] overflow-hidden rounded-lg border border-border bg-card shadow-xl backdrop-blur-xl"
      >
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-foreground">Auto-Pilot</h3>
            </div>
            <button
              onClick={onCancel}
              className="rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 mb-3">
            <PhaseItem label="Brief" isDone={phasesCompleted.brief} isActive={phase === "brief"} />
            <PhaseItem label="Outline" isDone={phasesCompleted.outline} isActive={phase === "outline"} />
            <PhaseItem 
              label="Draft" 
              isDone={phasesCompleted.draft} 
              isActive={phase === "draft"} 
              extra={phase === "draft" ? `${wordCount}/${targetWordCount}` : undefined}
            />
            <PhaseItem label="SEO" isDone={phasesCompleted.seo} isActive={phase === "seo"} />
          </div>

          {phase && (
            <div className="mb-3">
              <GenerationProgress 
                phase={phase} 
                progress={progress} 
                thinkingText={thinkingText} 
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-2">
             <p className="text-[10px] text-muted-foreground font-medium">Processing...</p>
             <button 
                onClick={onCancel}
                className="text-[10px] font-semibold text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
             >
                Cancel
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PhaseItem({ label, isDone, isActive, extra }: { label: string; isDone: boolean; isActive: boolean; extra?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-md px-2.5 py-1.5 transition-all",
      isActive ? 'bg-primary/5 border border-primary/20' : 'bg-transparent'
    )}>
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center">
          {isDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : isActive ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <div className="h-2 w-2 rounded-full border border-muted-foreground/30" />
          )}
        </div>
        <span className={cn(
          "text-[11px] font-semibold",
          isActive ? 'text-foreground' : 'text-muted-foreground',
          isDone && 'text-emerald-500'
        )}>
          {label}
        </span>
      </div>
      {extra && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md"
        >
          {extra}
        </motion.span>
      )}
    </div>
  );
}
