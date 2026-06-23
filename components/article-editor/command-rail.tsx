"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, List, PenLine, CheckCircle2, Zap, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, key: "brief",   label: "SEO Brief",       icon: FileText, description: "Keyword research" },
  { id: 2, key: "outline", label: "Outline",          icon: List,     description: "Structure" },
  { id: 3, key: "draft",   label: "Draft & Optimize", icon: PenLine,  description: "Write and refine" },
] as const;

// ── Command Rail ───────────────────────────────────────────────────
interface CommandRailProps {
  keyword: string;
  activeStep: number;
  hasBrief: boolean;
  hasOutline: boolean;
  hasDraft: boolean;
  seoScore: number;
  wordCount: number;
  targetWordCount: number;
  autoPilot: boolean;
  autoPilotRunning: boolean;
  autoPilotPhase: string | null;
  onToggleAutoPilot: () => void;
  onRunAutoPilot: () => void;
  onStepClick?: (step: number) => void;
}

export function CommandRail({
  keyword,
  activeStep,
  hasBrief,
  hasOutline,
  hasDraft,
  seoScore,
  wordCount,
  targetWordCount,
  autoPilot,
  autoPilotRunning,
  autoPilotPhase,
  onToggleAutoPilot,
  onRunAutoPilot,
  onStepClick,
}: CommandRailProps) {
  const readingTime = Math.ceil(wordCount / 200);

  const stepDoneMap: Record<number, boolean> = {
    1: hasBrief,
    2: hasOutline,
    3: hasDraft,
  };

  // Abbreviated labels for mobile
  const mobileLabels: Record<number, string> = {
    1: "Brief",
    2: "Outline", 
    3: "Draft"
  };

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-2 overflow-x-auto scrollbar-hide">
      {/* Steps */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {STEPS.map((step, idx) => {
          const isDone   = stepDoneMap[step.id];
          const isActive = activeStep === step.id;
          const isPending = !isDone && !isActive;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => onStepClick?.(step.id)}
                disabled={!isDone && !isActive}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border transition-all whitespace-nowrap",
                  "h-7 px-3 sm:h-10 sm:px-4",
                  "text-[10px] sm:text-sm font-bold uppercase tracking-tight",
                  isActive  && "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]",
                  isDone    && "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 cursor-pointer",
                  isPending && "border-border bg-muted text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                ) : (
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                )}
                <span className="sm:hidden leading-none">{mobileLabels[step.id]}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/30 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Auto-Pilot */}
        {!autoPilotRunning && (
          <button
            onClick={onRunAutoPilot}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white font-black shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all
              h-7 px-3 sm:h-10 sm:px-4 text-[10px] sm:text-sm uppercase tracking-tight"
          >
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="sm:hidden leading-none">Auto</span>
            <span className="hidden sm:inline">Auto-Pilot</span>
          </button>
        )}

        {autoPilotRunning && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10">
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-[#818cf8] shrink-0" />
            <span className="text-[11px] sm:text-sm font-semibold text-[#818cf8] hidden sm:inline">
              {autoPilotPhase === "brief" ? "Analyzing..." : autoPilotPhase === "outline" ? "Outlining..." : autoPilotPhase === "seo" ? "Optimizing..." : "Writing..."}
            </span>
          </div>
        )}

        {/* SEO Score */}
        {seoScore > 0 && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border bg-muted/30">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">SEO</span>
            <span className={cn(
              "text-[11px] sm:text-sm font-bold tabular-nums",
              seoScore >= 80 ? "text-[#22d3ee]" : seoScore >= 60 ? "text-[#f59e0b]" : "text-[#f43f5e]"
            )}>
              {seoScore}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
