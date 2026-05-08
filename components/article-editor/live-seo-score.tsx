"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Zap, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
      toast.success("AI has optimized your content!");
    } catch (err) {
      toast.error("Failed to optimize content");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!scoreData) return null;

  const score = scoreData.overall;
  const scoreChange = score - previousScore;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const strokeColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-white/10 bg-surface-2/30 backdrop-blur-md shadow-2xl overflow-hidden relative group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="h-20 w-20 transform -rotate-90">
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/5" />
            <motion.circle
              cx="40" cy="40" r="34" stroke={strokeColor} strokeWidth="6" fill="none"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - score / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={cn("text-2xl font-black leading-none", scoreColor)}>{score}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-text-3 mt-1">SEO</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-text-1">Content Health</h3>
            <AnimatePresence>
              {scoreChange !== 0 && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className={cn("flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                    scoreChange > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}
                >
                  {scoreChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(scoreChange)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[11px] text-text-3 leading-relaxed mb-3">
            {score >= 80 ? "Perfect! Your content is optimized for high visibility." :
             score >= 60 ? "Good progress. Apply the AI fixes to hit 90+." :
             "Weak optimization. The AI can fix this in one click."}
          </p>
          
          <button 
            onClick={handleAIFixAll}
            disabled={isOptimizing || score >= 95}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:bg-surface-3 transition-all text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            {isOptimizing ? <Zap className="h-3.5 w-3.5 animate-pulse" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Fix Everything
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-3 hover:text-text-2 transition-colors px-1"
        >
          <span>Score Breakdown</span>
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3 pt-1"
            >
              <div className="grid grid-cols-3 gap-2">
                <ScoreMiniCard label="Keyword" score={scoreData.keyword.score} />
                <ScoreMiniCard label="Readability" score={scoreData.readability.score} />
                <ScoreMiniCard label="Structure" score={scoreData.structure.score} />
              </div>

              {scoreData.suggestions && scoreData.suggestions.length > 0 && (
                <div className="space-y-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  {scoreData.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-text-2 leading-relaxed">{suggestion}</span>
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
  const color = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
      <p className="text-[9px] font-bold text-text-3 uppercase mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className={cn("h-full rounded-full", color)} />
        </div>
        <span className="text-[10px] font-bold text-text-1">{score}</span>
      </div>
    </div>
  );
}
