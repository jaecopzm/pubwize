"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateSEOScore } from "@/lib/seo-scoring";
import { cn } from "@/lib/utils";

interface LiveSEOScoreProps {
  content: string;
  keyword: string;
  debounceMs?: number;
}

export function LiveSEOScore({ content, keyword, debounceMs = 300 }: LiveSEOScoreProps) {
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [debouncedContent, setDebouncedContent] = useState(content);

  // Debounce content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs]);

  // Calculate score when debounced content changes
  useEffect(() => {
    const newScoreData = calculateSEOScore(debouncedContent, keyword);
    const newScore = newScoreData.overall;
    
    setPreviousScore(score);
    setScore(newScore);
  }, [debouncedContent, keyword]);

  const scoreChange = score - previousScore;
  const scoreColor = score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const scoreColorRaw = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      {/* Circular progress */}
      <div className="relative flex-shrink-0">
        <svg className="h-16 w-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke={scoreColorRaw}
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - score / 100) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xl font-bold", scoreColor)}>{score}</span>
        </div>
      </div>

      {/* Score info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm">SEO Score</h3>
          {scoreChange !== 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 text-xs"
            >
              {scoreChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+{scoreChange}</span>
                </>
              ) : scoreChange < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500 font-medium">{scoreChange}</span>
                </>
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
            </motion.div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {score >= 80
            ? "Excellent! Ready to publish"
            : score >= 60
            ? "Good, but could be better"
            : "Needs improvement"}
        </p>
      </div>
    </div>
  );
}
