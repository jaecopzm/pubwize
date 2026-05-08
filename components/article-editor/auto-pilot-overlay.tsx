"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Loader2, X, ChevronRight } from "lucide-react";
import { GenerationProgress } from "./generation-progress";

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
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-white/10 bg-surface-1/80 p-4 shadow-2xl backdrop-blur-xl sm:w-[400px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <Zap className="h-3.5 w-3.5 fill-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-text-1">Auto-Pilot Active</h3>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-text-3 transition-colors hover:bg-white/5 hover:text-text-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <PhaseItem label="SEO Brief" isDone={phasesCompleted.brief} isActive={phase === "brief"} />
            <PhaseItem label="Outline" isDone={phasesCompleted.outline} isActive={phase === "outline"} />
            <PhaseItem 
              label="Article Draft" 
              isDone={phasesCompleted.draft} 
              isActive={phase === "draft"} 
              extra={phase === "draft" ? `${wordCount} / ${targetWordCount} words` : undefined}
            />
            <PhaseItem label="SEO Polish" isDone={phasesCompleted.seo} isActive={phase === "seo"} />
          </div>

          {phase && (
            <GenerationProgress 
              phase={phase} 
              progress={progress} 
              thinkingText={thinkingText} 
            />
          )}

          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
             <p className="text-[10px] text-text-3 font-mono">ESTIMATED TIME: ~3 MIN</p>
             <button 
                onClick={onCancel}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
             >
                Stop Generation
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PhaseItem({ label, isDone, isActive, extra }: { label: string; isDone: boolean; isActive: boolean; extra?: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/5 border border-white/5' : ''}`}>
      <div className="flex items-center gap-3">
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : isActive ? (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-white/10" />
        )}
        <span className={`text-xs font-medium ${isDone || isActive ? 'text-text-1' : 'text-text-3'}`}>{label}</span>
      </div>
      {extra && <span className="text-[10px] font-mono text-indigo-400">{extra}</span>}
      {!isDone && !isActive && <ChevronRight className="h-3 w-3 text-text-3/30" />}
    </div>
  );
}
