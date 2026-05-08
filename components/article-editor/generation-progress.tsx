"use client";

import { Loader2, Sparkles, FileText, List, PenLine, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const PHASE_CONFIG = {
  brief: {
    icon: FileText,
    color: "gold",
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
    color: "teal",
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
    color: "indigo-400",
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
    color: "lilac",
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
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  // Use thinking text if available, otherwise cycle through messages
  const displayText = thinkingText?.trim().split("\n").pop() || config.messages[0];

  const colorMap: Record<string, { border: string; bg: string; text: string; bar: string }> = {
    gold: { border: "border-gold/20", bg: "bg-gold/5", text: "text-gold", bar: "from-gold to-amber-500" },
    teal: { border: "border-teal/20", bg: "bg-teal/5", text: "text-teal", bar: "from-teal to-emerald-500" },
    "indigo-400": { border: "border-indigo-400/20", bg: "bg-indigo-400/5", text: "text-indigo-400", bar: "from-indigo-500 to-purple-500" },
    lilac: { border: "border-lilac/20", bg: "bg-lilac/5", text: "text-lilac", bar: "from-lilac to-fuchsia-500" },
  };
  const colors = colorMap[config.color] || colorMap.gold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 sm:p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold font-mono-dm ${colors.text} truncate max-w-[250px] sm:max-w-none`}>
              {displayText}
            </p>
          </div>
        </div>
        {estimatedSeconds != null && estimatedSeconds > 0 && (
          <span className="text-[10px] sm:text-xs font-mono text-text-3 tabular-nums shrink-0 ml-2">
            ~{estimatedSeconds}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bar} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ width: progress != null ? `${progress}%` : "30%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {progress != null && (
        <p className="mt-2 text-right text-[10px] font-mono text-text-3 tabular-nums">
          {Math.round(progress)}%
        </p>
      )}
    </motion.div>
  );
}
