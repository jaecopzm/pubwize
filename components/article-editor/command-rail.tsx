"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, List, PenLine, Share2, CheckCircle2, Zap, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, key: "brief",   label: "SEO Brief",       icon: FileText, description: "Keyword research" },
  { id: 2, key: "outline", label: "Outline",          icon: List,     description: "Structure" },
  { id: 3, key: "draft",   label: "Draft",            icon: PenLine,  description: "AI article" },
  { id: 4, key: "social",  label: "Social & Publish", icon: Share2,   description: "Distribute" },
] as const;

// ── SEO Arc Gauge (theme-aware) ────────────────────────────────────
function SEOArcGauge({ score }: { score: number }) {
  const radius = 38;
  const strokeWidth = 5;
  const center = 48;
  const startAngle = 165;
  const sweepAngle = 210;
  const clampedScore = Math.max(0, Math.min(100, score));
  const fillAngle = (clampedScore / 100) * sweepAngle;

  const polarToXY = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, sweep: number) => {
    if (sweep <= 0) return "";
    const end = start + sweep;
    const s = polarToXY(start);
    const e = polarToXY(end);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const trackPath = describeArc(startAngle, sweepAngle);
  const fillPath  = describeArc(startAngle, fillAngle);

  const color =
    clampedScore >= 80 ? "#22d3ee" :
    clampedScore >= 60 ? "#f59e0b" :
    "#f43f5e";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="72" viewBox="0 0 96 80" fill="none">
        <path d={trackPath} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" className="text-black/8 dark:text-white/6" />
        {fillPath && (
          <path
            d={fillPath}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-1">
        <span className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
          {clampedScore}
        </span>
        <span className="text-[9px] text-foreground/25 font-mono mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ── Command Rail ───────────────────────────────────────────────────
interface CommandRailProps {
  keyword: string;
  activeStep: number;
  hasBrief: boolean;
  hasOutline: boolean;
  hasDraft: boolean;
  hasSocial: boolean;
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
  hasSocial,
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
    4: hasSocial,
  };

  // Abbreviated labels for mobile
  const mobileLabels: Record<number, string> = {
    1: "Brief",
    2: "Outline", 
    3: "Draft",
    4: "Social"
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2.5 overflow-x-auto scrollbar-hide">
      {/* Steps */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isDone   = stepDoneMap[step.id];
          const isActive = activeStep === step.id;
          const isPending = !isDone && !isActive;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onStepClick?.(step.id)}
                disabled={!isDone && !isActive}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md border transition-all whitespace-nowrap",
                  "h-5 px-2 sm:h-auto sm:px-2.5 sm:py-1.5 sm:rounded-lg",
                  "text-[9px] sm:text-xs font-bold uppercase tracking-tight",
                  isActive  && "border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]",
                  isDone    && "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 cursor-pointer",
                  isPending && "border-border bg-muted text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
                ) : (
                  <Icon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
                )}
                <span className="sm:hidden leading-none">{mobileLabels[step.id]}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/25 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Auto-Pilot */}
        {!autoPilotRunning && (
          <button
            onClick={onRunAutoPilot}
            className="flex items-center justify-center gap-1 rounded-md sm:rounded-lg bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white font-black shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all
              h-5 px-2 sm:h-auto sm:px-3 sm:py-1.5 sm:text-xs text-[9px] uppercase tracking-tight"
          >
            <Zap className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="sm:hidden leading-none">Auto</span>
            <span className="hidden sm:inline">Auto-Pilot</span>
          </button>
        )}

        {autoPilotRunning && (
          <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10">
            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-[#818cf8] shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold text-[#818cf8] hidden sm:inline">
              {autoPilotPhase === "brief" ? "Analyzing..." : autoPilotPhase === "outline" ? "Outlining..." : autoPilotPhase === "seo" ? "Optimizing..." : "Writing..."}
            </span>
          </div>
        )}

        {/* SEO Score */}
        {seoScore > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-border bg-muted/30">
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground">SEO</span>
            <span className={cn(
              "text-[10px] sm:text-xs font-bold tabular-nums",
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
