"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getPhases, getRandomTip, getEstimatedTime } from "@/lib/generation-steps";
import { cn } from "@/lib/utils";

interface GenerationLoaderProps {
  step: 'brief' | 'outline' | 'draft' | 'optimize';
  message?: string;
  keyword?: string;
}

export function GenerationLoader({ step, message, keyword }: GenerationLoaderProps) {
  const phases = getPhases(step);
  const estimatedTime = getEstimatedTime(step);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [currentTip, setCurrentTip] = useState(() => getRandomTip(step));
  const [progress, setProgress] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (phases.length === 0) return;

    let phaseIdx = 0;
    const scheduleNextPhase = () => {
      if (phaseIdx >= phases.length - 1) return;
      const delay = phases[phaseIdx]?.durationMs ?? 4000;
      return setTimeout(() => {
        setCompletedPhases(prev => new Set([...prev, phaseIdx]));
        phaseIdx++;
        setCurrentPhaseIndex(phaseIdx);
        setFadeKey(k => k + 1);
        scheduleNextPhase();
      }, delay);
    };

    const timeoutId = scheduleNextPhase();

    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const remaining = 95 - prev;
        return prev + remaining * 0.03;
      });
    }, 300);

    const tipInterval = setInterval(() => {
      setCurrentTip(getRandomTip(step));
    }, 6000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [step, phases]);

  const currentPhase = phases[currentPhaseIndex];
  const detail = currentPhase?.detail?.(keyword);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 w-full max-w-md mx-auto text-center">
      {/* Simple, sleek loader */}
      <div className="relative mb-6">
        <div className="h-10 w-10 flex items-center justify-center rounded-full border border-border bg-background shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="text-sm font-semibold text-foreground">
          {message || `Generating ${step}...`}
        </h3>
        {estimatedTime && (
          <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
            Estimated time: ~{estimatedTime}s
          </p>
        )}
      </div>

      {/* Progress & Phases */}
      <div className="w-full bg-card border border-border rounded-lg p-4 shadow-sm text-left space-y-4">
        <div>
          <div className="flex justify-between items-center text-xs font-medium text-foreground mb-1.5">
            <span className="truncate">
              {currentPhase?.label ?? 'Starting...'}
            </span>
            <span className="font-mono text-muted-foreground shrink-0">{Math.round(progress)}%</span>
          </div>
          
          {/* Plain, clean progress bar */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* Phase List */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          {phases.map((ph, idx) => {
            const isCompleted = completedPhases.has(idx);
            const isActive = idx === currentPhaseIndex;
            return (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted bg-transparent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-xs font-medium",
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}>
                    {ph.label}
                  </p>
                  {isActive && detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      {detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip Banner */}
      {currentTip && (
        <div className="mt-6 p-3 rounded-lg border border-border/50 bg-muted/30 text-left w-full">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {currentTip}
          </p>
        </div>
      )}
    </div>
  );
}
