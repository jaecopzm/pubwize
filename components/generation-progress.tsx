"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface GenerationProgressProps {
  stages: Stage[];
  currentStage: number;
  estimatedTime?: number;
}

export function GenerationProgress({
  stages,
  currentStage,
  estimatedTime,
}: GenerationProgressProps) {
  const progress = (currentStage / stages.length) * 100;

  return (
    <div className="space-y-4 p-5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">
            Engine Active
          </h4>
        </div>
        {estimatedTime && (
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
            {estimatedTime}S REMAINING
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-muted/20 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-cyan-400 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
      </div>

      {/* Stages */}
      <div className="space-y-1.5">
        {stages.map((stage, index) => {
          const isActive = stage.status === "active";
          const isComplete = stage.status === "complete";
          
          return (
            <motion.div
              key={stage.id}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-300",
                isActive ? "bg-primary/5 border border-primary/10 shadow-sm" : "border border-transparent"
              )}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex-shrink-0">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
                  >
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  </motion.div>
                ) : isActive ? (
                  <div className="h-4 w-4 relative flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted/20 flex items-center justify-center opacity-30">
                    <div className="h-0.5 w-0.5 rounded-full bg-muted" />
                  </div>
                )}
              </div>
              
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground/60",
                  isComplete && "text-emerald-500/50"
                )}
              >
                {stage.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border/20 flex items-center justify-center">
        <p className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest italic">
          Optimizing for impact...
        </p>
      </div>
    </div>
  );
}
