"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-primary/20"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-[-8px] rounded-full bg-primary/10"
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full shadow-2xl shadow-primary/40 bg-gradient-to-br from-primary to-cyan-500"
        >
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </motion.div>
      </div>

      {/* Primary message with estimated time */}
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-sm sm:text-base md:text-lg font-semibold font-mono-dm text-foreground text-center px-4"
      >
        {message || `Generating ${step}...`}
      </motion.h3>

      {/* Estimated time */}
      {estimatedTime && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2 text-[10px] sm:text-xs text-muted-foreground/70 text-center"
        >
          Usually takes ~{estimatedTime} seconds
        </motion.p>
      )}

      {/* Current phase label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`label-${fadeKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="mb-1 text-xs sm:text-sm font-medium text-primary text-center px-4"
        >
          {currentPhase?.label ?? ''}
        </motion.p>
      </AnimatePresence>

      {/* Phase detail */}
      {detail && (
        <AnimatePresence mode="wait">
          <motion.p
            key={`detail-${fadeKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] md:text-xs text-muted-foreground text-center max-w-xs sm:max-w-sm px-4"
          >
            {detail}
          </motion.p>
        </AnimatePresence>
      )}
      {!detail && <div className="mb-4 sm:mb-6" />}

      {/* Progress bar */}
      <div className="w-full max-w-xs sm:max-w-sm mb-4 sm:mb-6 px-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={isActive ? { scale: [1, 1.25, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-500 ${
                        isActive
                          ? 'bg-primary shadow-lg shadow-primary/50'
                          : 'bg-muted/30'
                      }`}
                    />
                  )}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-card border border-border px-2 py-0.5 text-[10px] text-foreground shadow-lg">
                    {phase.label}
                  </div>
                </div>
                {i < phases.length - 1 && (
                  <motion.div
                    className="h-px w-3 sm:w-4 md:w-6"
                    initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    animate={{ backgroundColor: isDone ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                    transition={{ duration: 0.7 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rotating tip */}
      <AnimatePresence mode="wait">
        {currentTip && (
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-xs sm:max-w-sm rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3 text-center mx-4"
          >
            <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-relaxed">
              {currentTip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
