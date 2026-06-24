"use client";

import { motion } from "framer-motion";
import { FileText, List, PenLine, CheckCircle2, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Brief", icon: FileText },
  { id: 2, label: "Outline", icon: List },
  { id: 3, label: "Draft", icon: PenLine },
] as const;

interface MobileStepStripProps {
  activeStep: number;
  hasBrief: boolean;
  hasOutline: boolean;
  hasDraft: boolean;
  autoPilotRunning: boolean;
  autoPilotPhase: string | null;
  onStepClick: (step: number) => void;
}

export function MobileStepStrip({
  activeStep,
  hasBrief,
  hasOutline,
  hasDraft,
  autoPilotRunning,
  autoPilotPhase,
  onStepClick,
}: MobileStepStripProps) {
  const doneMap: Record<number, boolean> = {
    1: hasBrief,
    2: hasOutline,
    3: hasDraft,
  };

  return (
    <div className="md:hidden sticky top-10 z-40 flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card/90 backdrop-blur-sm overflow-x-auto scrollbar-hide">
      {STEPS.map((step, idx) => {
        const isDone = doneMap[step.id];
        const isActive = activeStep === step.id;
        const isLocked = !isDone && !isActive;
        const isRunning = autoPilotRunning && autoPilotPhase === step.label.toLowerCase();
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => !isLocked && onStepClick(step.id)}
              disabled={isLocked}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap",
                isDone && "border-emerald-500/30 bg-emerald-500/8 text-emerald-400",
                isActive && !isDone && "border-violet-500/40 bg-violet-500/10 text-violet-400",
                isLocked && "border-border bg-transparent text-muted-foreground/40 cursor-not-allowed opacity-50"
              )}
            >
              {isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isDone ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {step.label}
            </button>

            {idx < STEPS.length - 1 && (
              <div className="h-px w-4 bg-border/60 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
