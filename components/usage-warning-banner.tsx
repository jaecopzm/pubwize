"use client";

import { AlertTriangle, X, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UsageWarningBannerProps {
  articlesUsed: number;
  articlesLimit: number;
  planTier: string;
}

export function UsageWarningBanner({ articlesUsed, articlesLimit, planTier }: UsageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  
  const usagePercent = (articlesUsed / articlesLimit) * 100;
  const remaining = articlesLimit - articlesUsed;

  // Only show at 90% or above
  if (usagePercent < 90 || dismissed) return null;

  const isMaxed = remaining === 0;

  return (
    <div className={cn(
      "relative border-b transition-all",
      isMaxed 
        ? "bg-destructive/10 border-destructive/20" 
        : "bg-gold/10 border-gold/20"
    )}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              isMaxed ? "bg-destructive/20" : "bg-gold/20"
            )}>
              {isMaxed ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Zap className="h-4 w-4 text-gold" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isMaxed ? (
                  <>You've reached your article limit for this month</>
                ) : (
                  <>Only {remaining} article{remaining !== 1 ? 's' : ''} remaining this month</>
                )}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                {isMaxed 
                  ? `Upgrade to continue creating content` 
                  : `Upgrade to ${planTier === 'free' ? 'Starter' : 'Pro'} for more articles`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/settings?tab=billing"
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105",
                isMaxed
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-gold text-obsidian hover:bg-gold/90"
              )}
            >
              Upgrade
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
