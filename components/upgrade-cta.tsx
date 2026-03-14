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
      <div className={cn("relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-gold/5 p-4", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-gold" />
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
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 text-sm font-medium transition-all",
          className
        )}
      >
        <Crown className="h-4 w-4" />
        Upgrade
      </Link>
    );
  }

  return (
    <div className={cn("card-premium rounded-xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-6", className)}>
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
          <Crown className="h-6 w-6 text-gold" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">Upgrade to Unlock More</h3>
          <p className="text-sm text-muted-foreground">
            {reason || "Get 5x more articles, unlimited AI improvements, and priority support"}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-gold" />
          <span>25-100 articles per month</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-teal" />
          <span>Unlimited AI improvements</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-lilac" />
          <span>Priority support & advanced features</span>
        </div>
      </div>

      <Link
        href="/dashboard/settings?tab=billing"
        className="btn-gold w-full justify-center"
      >
        View Plans
      </Link>

      <p className="text-center text-xs text-muted-foreground mt-3">
        <span className="text-gold font-medium">Limited time:</span> Get 20% off your first month
      </p>
    </div>
  );
}
