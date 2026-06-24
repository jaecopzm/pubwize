"use client";

import { FileText, List, PenLine, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, key: "brief",   label: "Brief",          icon: FileText },
  { id: 2, key: "outline", label: "Outline",         icon: List },
  { id: 3, key: "draft",   label: "Draft & Optimize", icon: PenLine },
] as const;

interface StepSidebarProps {
  activeStep: number;
  hasBrief: boolean;
  hasOutline: boolean;
  hasDraft: boolean;
  wordCount: number;
  targetWordCount: number;
  seoScore: number;
  autoPilotRunning: boolean;
  autoPilotPhase: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStepClick: (step: number) => void;
}

export function StepSidebar({
  activeStep,
  hasBrief,
  hasOutline,
  hasDraft,
  wordCount,
  targetWordCount,
  seoScore,
  autoPilotRunning,
  autoPilotPhase,
  collapsed,
  onToggleCollapse,
  onStepClick,
}: StepSidebarProps) {
  const doneMap: Record<number, boolean> = { 1: hasBrief, 2: hasOutline, 3: hasDraft };

  return (
    <aside
      style={{ width: collapsed ? 56 : 220 }}
      className="hidden md:flex flex-col shrink-0 border-r border-border bg-card transition-[width] duration-200 overflow-hidden"
      ref={(el) => {
        if (el) {
          const w = collapsed ? 56 : 220;
          document.documentElement.style.setProperty("--sidebar-left-w", `${w}px`);
        }
      }}
    >
      {/* Collapse toggle */}
      <div className={cn("flex p-2 border-b border-border", collapsed ? "justify-center" : "justify-end")}>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-0.5 p-3 pt-3 flex-1">
        {STEPS.map((step) => {
          const done = doneMap[step.id];
          const active = activeStep === step.id;
          const locked = !done && !active;
          const spinning = autoPilotRunning && autoPilotPhase === step.key;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => !locked && onStepClick(step.id)}
              disabled={locked}
              title={collapsed ? step.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors w-full",
                active   && "bg-accent text-foreground",
                !active  && !locked && "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                locked   && "opacity-35 cursor-not-allowed",
                collapsed && "justify-center px-0"
              )}
            >
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                active && "bg-foreground/8",
              )}>
                {spinning
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : done
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <Icon className="h-3.5 w-3.5" />
                }
              </span>

              {!collapsed && (
                <span className="text-sm font-medium leading-none truncate">
                  {step.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats footer */}
      {!collapsed && (wordCount > 0 || seoScore > 0) && (
        <div className="border-t border-border p-3 space-y-2">
          {wordCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Words</span>
                <span className="tabular-nums">{wordCount.toLocaleString()} / {targetWordCount.toLocaleString()}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500",
                    wordCount >= targetWordCount ? "bg-emerald-500" : "bg-foreground/30"
                  )}
                  style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          {seoScore > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>SEO score</span>
              <span className={cn("tabular-nums font-semibold",
                seoScore >= 80 ? "text-emerald-500" : seoScore >= 60 ? "text-amber-500" : "text-rose-500"
              )}>
                {seoScore}/100
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
