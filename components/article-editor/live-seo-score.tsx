"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateSEOScore, SEOScore } from '@/lib/seo-scoring';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LiveSEOScore({ content, keyword, onUpdate }: { content: string; keyword: string; onUpdate?: (content: string) => void }) {
  const [scoreData, setScoreData] = useState<SEOScore | null>(null);
  const [previousScore, setPreviousScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const debouncedContent = useDebouncedValue(content, 500);

  useEffect(() => {
    if (!debouncedContent) return;
    const newData = calculateSEOScore(debouncedContent, keyword);
    setPreviousScore(scoreData?.overall || 0);
    setScoreData(newData);
  }, [debouncedContent, keyword]);

  const handleAIFixAll = async () => {
    if (!scoreData || scoreData.suggestions.length === 0) return;
    
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/articles/optimize-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          keyword,
          suggestions: scoreData.suggestions,
        }),
      });

      if (!res.ok) throw new Error("Optimization failed");
      
      const { optimizedContent } = await res.json();
      if (onUpdate) onUpdate(optimizedContent);
      toast.success("Content optimized!");
    } catch (err) {
      toast.error("Failed to optimize");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!scoreData) return null;

  const score = scoreData.overall;
  const scoreChange = score - previousScore;
  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  const strokeColor = score >= 80 ? 'hsl(var(--primary))' : score >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="h-16 w-16 transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted" />
            <motion.circle
              cx="32" cy="32" r="28" stroke={strokeColor} strokeWidth="3" fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - score / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={cn("text-xl font-bold leading-none tabular-nums", scoreColor)}>{score}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">SEO</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SEO Score</h3>
            <AnimatePresence mode="wait">
              {scoreChange !== 0 && (
                <motion.span 
                  key={scoreChange}
                  initial={{ opacity: 0, y: scoreChange > 0 ? 10 : -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: scoreChange > 0 ? -10 : 10 }}
                  className={cn("flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                    scoreChange > 0 ? "bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {scoreChange > 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                  {Math.abs(scoreChange)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mb-2">
            {score >= 80 ? "Great! Your content is well optimized." :
             score >= 60 ? "Good progress. A few improvements will boost this to 80+." :
             "Needs work. Use AI to improve your SEO score."}
          </p>
        </div>
      </div>
      
      <button 
        onClick={handleAIFixAll}
        disabled={isOptimizing || score >= 95}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95"
      >
        {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        AI Optimize
      </button>

      <div className="mt-1">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Details</span>
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
                <ScoreMiniCard label="Keyword" score={scoreData.keyword.score} />
                <ScoreMiniCard label="Readability" score={scoreData.readability.score} />
                <ScoreMiniCard label="Structure" score={scoreData.structure.score} />
              </div>

              {scoreData.suggestions && scoreData.suggestions.length > 0 && (
                <div className="mt-2 space-y-1.5 bg-muted/50 rounded-lg p-3 border border-border">
                  <h5 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Suggestions</h5>
                  {scoreData.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      <span className="text-[10px] font-medium text-muted-foreground leading-relaxed">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScoreMiniCard({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="bg-muted/50 rounded-lg p-2 border border-border hover:bg-muted transition-all">
      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-foreground tabular-nums">{score}</span>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${score}%` }} 
            transition={{ duration: 1, delay: 0.1 }}
            className={cn("h-full rounded-full", color)} 
          />
        </div>
      </div>
    </div>
  );
}
