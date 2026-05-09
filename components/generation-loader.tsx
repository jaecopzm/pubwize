"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
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
  }, [step, phases]);

  const currentPhase = phases[currentPhaseIndex];
  const detail = currentPhase?.detail?.(keyword);

  return (
    <div className="relative flex flex-col items-center justify-center py-8 sm:py-12 px-6 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            opacity: [0.03, 0.06, 0.03],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary blur-[100px] rounded-full"
        />
      </div>

      {/* Compact Prism Pulse Core */}
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-card border border-primary/20 shadow-xl backdrop-blur-xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-cyan-500/10 to-violet-500/10"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 3, -3, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-6 w-6 text-primary shadow-primary/50 drop-shadow-md" />
          </motion.div>
          
          {/* Scanning Line Effect */}
          <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[1px] bg-primary/20 z-10"
          />
        </div>
      </div>

      {/* Compact Main Status */}
      <div className="text-center space-y-1.5 mb-6 z-10">
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base sm:text-lg font-bold tracking-tight text-foreground"
        >
          {message || `Generating ${step}...`}
        </motion.h3>
        
        {estimatedTime && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-[10px] uppercase tracking-[0.15em] font-mono text-muted-foreground"
          >
            EST: ~{estimatedTime} SEC
          </motion.p>
        )}
      </div>

      {/* Compact Progress & Steps Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[320px] bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-5 shadow-xl relative z-10"
      >
        {/* Phase Info */}
        <div className="h-12 mb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={fadeKey}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.3 }}
              className="space-y-0.5"
            >
              <p className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
                {currentPhase?.label ?? 'Initializing...'}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                {detail || "Syncing with AI neural networks..."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimalist Progress Bar */}
        <div className="relative h-1 w-full bg-muted/20 rounded-full overflow-hidden mb-5">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-cyan-400 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Compact Phase Dots */}
        <div className="flex justify-between items-center px-0.5">
          {phases.map((_, i) => (
            <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
              <motion.div
                initial={false}
                animate={{
                  scale: i === currentPhaseIndex ? 1.1 : 1,
                  backgroundColor: i <= currentPhaseIndex ? "var(--primary)" : "var(--muted)",
                  opacity: i === currentPhaseIndex ? 1 : 0.2,
                }}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                  i < currentPhaseIndex && "bg-emerald-500 opacity-80"
                )}
              />
              {i < phases.length - 1 && (
                <div className="h-[1px] flex-1 bg-border/20 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Minimal Tip */}
      <div className="mt-8 max-w-[280px] text-center">
        <AnimatePresence mode="wait">
          {currentTip && (
            <motion.p
              key={currentTip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-[10px] leading-relaxed italic text-muted-foreground font-medium"
            >
              {currentTip}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
