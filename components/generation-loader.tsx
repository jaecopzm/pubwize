"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { getPhases, getRandomTip, getEstimatedTime } from "@/lib/generation-steps";

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

    // Advance through phases based on each phase's durationMs
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

    const firstTimeout = scheduleNextPhase();

    // Smooth fake progress bar
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        // Ease out — goes fast at start, slows down near end
        const remaining = 95 - prev;
        return prev + remaining * 0.03;
      });
    }, 300);

    // Rotate tips every 6 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip(getRandomTip(step));
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [step]);

  const currentPhase = phases[currentPhaseIndex];
  const detail = currentPhase?.detail?.(keyword);

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-14 px-4">
      {/* Animated orb */}
      <div className="relative mb-5 sm:mb-7">
        <div className="absolute inset-0 animate-ping rounded-full bg-gold/15" style={{ animationDuration: '1.8s' }} />
        <div className="absolute inset-[-8px] animate-pulse rounded-full bg-gold/8" style={{ animationDuration: '2.5s' }} />
        <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full shadow-2xl shadow-gold/40"
          style={{ background: 'linear-gradient(135deg, var(--gold), #f97316)' }}>
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
      </div>

      {/* Primary message */}
      <h3 className="mb-1 text-sm sm:text-base md:text-lg font-semibold font-mono-dm text-text-1 text-center px-4">
        {message || `Generating ${step}...`}
      </h3>

      {/* Current phase label — fades on change */}
      <p
        key={`label-${fadeKey}`}
        className="mb-1 text-xs sm:text-sm font-medium text-gold text-center animate-in fade-in slide-in-from-bottom-2 duration-500 px-4"
      >
        {currentPhase?.label ?? ''}
      </p>

      {/* Phase detail */}
      {detail && (
        <p
          key={`detail-${fadeKey}`}
          className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] md:text-xs text-text-3 text-center max-w-xs sm:max-w-sm animate-in fade-in duration-700 px-4"
        >
          {detail}
        </p>
      )}
      {!detail && <div className="mb-4 sm:mb-6" />}

      {/* Progress bar */}
      <div className="w-full max-w-xs sm:max-w-sm mb-4 sm:mb-6 px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--gold), var(--teal), var(--lilac))',
            }}
          />
        </div>
      </div>

      {/* Phase timeline */}
      {phases.length > 0 && (
        <div className="flex items-center gap-1.5 mb-5 sm:mb-7 overflow-x-auto max-w-full px-4">
          {phases.map((phase, i) => {
            const isDone = completedPhases.has(i);
            const isActive = i === currentPhaseIndex;
            return (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <div className="relative group">
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                  ) : (
                    <div
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-500 ${isActive
                          ? 'bg-gold scale-125 shadow-lg shadow-gold/50'
                          : 'bg-white/15'
                        }`}
                    />
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-surface-2 border border-white/10 px-2 py-0.5 text-[10px] text-text-2">
                    {phase.label}
                  </div>
                </div>
                {i < phases.length - 1 && (
                  <div
                    className="h-px w-3 sm:w-4 md:w-6 transition-all duration-700"
                    style={{
                      background: isDone ? 'var(--teal)' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rotating tip */}
      {currentTip && (
        <div className="max-w-xs sm:max-w-sm rounded-xl border border-white/8 bg-white/4 px-3 sm:px-4 py-2.5 sm:py-3 text-center backdrop-blur-sm mx-4">
          <p className="text-[10px] sm:text-[11px] md:text-xs text-text-2 leading-relaxed">
            {currentTip}
          </p>
        </div>
      )}
    </div>
  );
}
