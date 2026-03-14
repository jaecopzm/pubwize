"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SuccessCelebrationProps {
  articleId: string;
  keyword: string;
  seoScore?: number;
  onContinue: () => void;
}

export function SuccessCelebration({ articleId, keyword, seoScore = 85, onContinue }: SuccessCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    setShow(true);
  }, []);

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { text: "Outstanding!", emoji: "🎉", color: "text-green-400" };
    if (score >= 80) return { text: "Excellent!", emoji: "✨", color: "text-green-400" };
    if (score >= 70) return { text: "Great!", emoji: "👍", color: "text-yellow-400" };
    return { text: "Good start!", emoji: "💪", color: "text-yellow-400" };
  };

  const scoreMsg = getScoreMessage(seoScore);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300",
      show ? "opacity-100" : "opacity-0"
    )}>
      <div className={cn(
        "relative mx-4 w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-2xl transition-transform duration-300",
        show ? "scale-100" : "scale-95"
      )}>
        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
          Article Generated! {scoreMsg.emoji}
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          "{keyword}" is ready to rank
        </p>

        {/* SEO Score */}
        <div className="mb-6 rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              <span className="text-sm font-medium text-foreground">SEO Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-3xl font-bold", scoreMsg.color)}>
                {seoScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {scoreMsg.text} Estimated rank: Top 5 within 30 days
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/dashboard/articles/${articleId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            View Article
            <ArrowRight className="h-4 w-4" />
          </Link>
          
          <button
            onClick={onContinue}
            className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Generate Another
          </button>
        </div>
      </div>
    </div>
  );
}
