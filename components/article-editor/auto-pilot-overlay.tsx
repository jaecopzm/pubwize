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
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[calc(100vw-48px)] overflow-hidden rounded-xl border border-primary/20 bg-card/70 p-4 shadow-2xl backdrop-blur-2xl sm:w-[360px]"
      >
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"
        />
        
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/20 shadow-inner">
                <Zap className="h-3.5 w-3.5 fill-primary" />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/20 rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-tight leading-none mb-0.5">Auto-Pilot</h3>
                <p className="text-[9px] text-primary/60 font-mono uppercase tracking-widest font-bold">PRISM CORE V2</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 mb-4">
            <PhaseItem label="SEO STRATEGY" isDone={phasesCompleted.brief} isActive={phase === "brief"} />
            <PhaseItem label="ARCHITECTURE" isDone={phasesCompleted.outline} isActive={phase === "outline"} />
            <PhaseItem 
              label="CONTENT SYNTHESIS" 
              isDone={phasesCompleted.draft} 
              isActive={phase === "draft"} 
              extra={phase === "draft" ? `${wordCount}/${targetWordCount}W` : undefined}
            />
            <PhaseItem label="SEO POLISH" isDone={phasesCompleted.seo} isActive={phase === "seo"} />
          </div>

          {phase && (
            <div className="mb-4">
              <GenerationProgress 
                phase={phase} 
                progress={progress} 
                thinkingText={thinkingText} 
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/40 pt-3.5">
             <div className="flex items-center gap-1.5">
               <Sparkles className="h-3 w-3 text-primary opacity-40" />
               <p className="text-[9px] text-muted-foreground/60 font-mono font-bold uppercase tracking-widest">Streaming...</p>
             </div>
             <button 
                onClick={onCancel}
                className="text-[9px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10"
             >
                Abort
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
      "flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-300",
      isActive ? 'bg-primary/5 border border-primary/10 shadow-inner' : 'bg-transparent border border-transparent'
    )}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-4 w-4 items-center justify-center">
          {isDone ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
            >
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
            </motion.div>
          ) : isActive ? (
            <div className="h-4 w-4 relative flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-3 w-3 rounded-full border border-muted/30 flex items-center justify-center opacity-30">
              <div className="h-0.5 w-0.5 rounded-full bg-muted" />
            </div>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-black tracking-wider uppercase",
          isActive ? 'text-foreground' : 'text-muted-foreground/80',
          isDone && 'text-emerald-500/80 opacity-70'
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
