"use client";

import { Crown, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpgradeCTAProps {
  variant?: 'banner' | 'card' | 'inline';
  reason?: string;
  className?: string;
}

export function UpgradeCTA({ variant = 'card', reason, className }: UpgradeCTAProps) {
  if (variant === 'banner') {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-[#6366f1]/30 bg-gradient-to-r from-[#6366f1]/10 to-[#6366f1]/5 p-4", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-[#818cf8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {reason || "Unlock unlimited potential"}
              </p>
              <p className="text-xs text-muted-foreground">
                Join 500+ creators on Starter or Pro
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=billing"
            className="btn-gold text-sm px-4 py-2 whitespace-nowrap"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        href="/dashboard/settings?tab=billing"
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366f1]/10 text-[#818cf8] hover:bg-[#6366f1]/20 text-sm font-medium transition-all",
          className
        )}
      >
        <Crown className="h-4 w-4" />
        Upgrade
      </Link>
    );
  }

  return (
    <div className={cn("card-premium rounded-lg sm:rounded-xl border border-[#6366f1]/30 bg-gradient-to-br from-card to-[#6366f1]/5 p-4 sm:p-6", className)}>
      <div className="flex items-start gap-3 mb-3 sm:mb-4">
        <div className="h-9 w-9 sm:h-12 sm:w-12 flex items-center justify-center shrink-0">
          <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1">Upgrade to Unlock More</h3>
          <p className="text-xs text-muted-foreground">
            {reason || "Get 5x more articles, unlimited AI improvements, and priority support"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#818cf8]" />
          <span>25-100 articles per month</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#22d3ee]" />
          <span>Unlimited AI improvements</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#a78bfa]" />
          <span>Priority support & advanced features</span>
        </div>
      </div>

      <Link
        href="/dashboard/settings?tab=billing"
        className="btn-gold w-full justify-center text-xs sm:text-sm py-2 sm:py-2.5 !rounded-lg"
      >
        View Plans
      </Link>

      <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
        Plans are monthly or annual with a 14-day money-back guarantee
      </p>
    </div>
  );
}
