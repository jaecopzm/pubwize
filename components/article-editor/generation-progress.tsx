"use client";

import { Loader2, Sparkles, FileText, List, PenLine, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PHASE_CONFIG = {
  brief: {
    icon: FileText,
    color: "indigo",
    messages: [
      "Scanning SERP landscape...",
      "Analyzing competitor content gaps...",
      "Mapping keyword intent signals...",
      "Extracting EEAT opportunities...",
      "Building content strategy...",
    ],
  },
  outline: {
    icon: List,
    color: "cyan",
    messages: [
      "Analyzing brief structure...",
      "Designing heading hierarchy...",
      "Optimizing section flow...",
      "Targeting snippet opportunities...",
      "Finalizing architecture...",
    ],
  },
  draft: {
    icon: PenLine,
    color: "rose",
    messages: [
      "Writing introduction...",
      "Expanding core sections...",
      "Adding supporting evidence...",
      "Weaving internal links...",
      "Polishing transitions...",
    ],
  },
  seo: {
    icon: TrendingUp,
    color: "emerald",
    messages: [
      "Auditing keyword density...",
      "Scanning NLP entities...",
      "Evaluating snippet potential...",
      "Analyzing link structure...",
      "Generating meta tags...",
    ],
  },
};

interface GenerationProgressProps {
  phase: keyof typeof PHASE_CONFIG;
  thinkingText?: string;
  /** 0-100 */
  progress?: number;
  estimatedSeconds?: number;
}

export function GenerationProgress({
  phase,
  thinkingText,
  progress,
  estimatedSeconds,
}: GenerationProgressProps) {
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.brief;
  const Icon = config.icon || Sparkles;

  const displayText = thinkingText?.trim().split("\n").pop() || config.messages[0];

  const colorMap: Record<string, { border: string; bg: string; text: string; bar: string; shadow: string }> = {
    indigo: { 
      border: "border-indigo-500/20", 
      bg: "bg-indigo-500/5", 
      text: "text-indigo-400", 
      bar: "from-indigo-500 via-violet-500 to-fuchsia-500",
      shadow: "shadow-indigo-500/10"
    },
    cyan: { 
      border: "border-cyan-500/20", 
      bg: "bg-cyan-500/5", 
      text: "text-cyan-400", 
      bar: "from-cyan-500 via-blue-500 to-indigo-500",
      shadow: "shadow-cyan-500/10"
    },
    rose: { 
      border: "border-rose-500/20", 
      bg: "bg-rose-500/5", 
      text: "text-rose-400", 
      bar: "from-rose-500 via-pink-500 to-orange-500",
      shadow: "shadow-rose-500/10"
    },
    emerald: { 
      border: "border-emerald-500/20", 
      bg: "bg-emerald-500/5", 
      text: "text-emerald-400", 
      bar: "from-emerald-500 via-teal-500 to-cyan-500",
      shadow: "shadow-emerald-500/10"
    },
  };
  
  const colors = colorMap[config.color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 backdrop-blur-xl shadow-lg ${colors.shadow}`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[9px] font-black uppercase tracking-wider ${colors.text} opacity-60`}>
                PRISM ENGINE
              </span>
              {estimatedSeconds != null && estimatedSeconds > 0 && (
                <span className="text-[9px] font-mono text-muted-foreground/50 tabular-nums">
                  ~{estimatedSeconds}S
                </span>
              )}
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={displayText}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className={`text-xs font-bold font-mono tracking-tight ${colors.text} truncate max-w-[180px] sm:max-w-none`}
              >
                {displayText}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        
        {progress != null && (
          <div className="text-right shrink-0">
            <span className={`text-sm font-black font-mono tracking-tighter ${colors.text}`}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      <div className="relative h-1 rounded-full bg-black/20 overflow-hidden border border-white/5">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"
        />
        
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bar} rounded-full relative z-20 shadow-[0_0_8px_rgba(255,255,255,0.1)]`}
          initial={{ width: "0%" }}
          animate={{ width: progress != null ? `${progress}%` : "30%" }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="mt-3 flex justify-between items-center">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-0.5 w-3 rounded-full transition-all duration-500 ${
                Object.keys(PHASE_CONFIG).indexOf(phase) >= i 
                  ? colors.text.replace('text-', 'bg-') + ' opacity-50'
                  : "bg-muted/10"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Loader2 className={`h-2.5 w-2.5 animate-spin ${colors.text} opacity-40`} />
          <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.1em]">
            Processing
          </span>
        </div>
      </div>
    </motion.div>
  );
}
