"use client";

import { X, Zap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, formatPrice, getAnnualSavingsPercentage, type PlanTier } from "@/lib/pricing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  reason?: string;
  onUpgrade?: (plan: PlanTier) => void;
}

export function UpgradeModal({ isOpen, onClose, currentPlan, reason, onUpgrade }: UpgradeModalProps) {
  const suggestedPlan: PlanTier = currentPlan === "free" ? "starter" : "pro";
  const plan = PLANS[suggestedPlan];
  const current = PLANS[currentPlan];
  const savingsPct = getAnnualSavingsPercentage(suggestedPlan);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-background overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-primary via-cyan-400 to-violet-500" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20">
                      <Zap className="h-3 w-3 text-primary fill-primary" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Upgrade</span>
                  </div>
                  <h2 className="text-base font-black text-foreground leading-tight">{plan.name} Plan</h2>
                  {reason && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{reason}</p>
                  )}
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-black text-foreground">{formatPrice(plan.price)}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
                {savingsPct > 0 && (
                  <span className="ml-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    Save {savingsPct}% yearly
                  </span>
                )}
              </div>

              {/* Stat comparison */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Articles / mo", from: current.limits.articlesPerMonth, to: plan.limits.articlesPerMonth },
                  { label: "AI Improvements", from: current.limits.aiImprovementsPerMonth, to: plan.limits.aiImprovementsPerMonth },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border bg-muted/40 p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-black text-muted-foreground line-through opacity-40">{stat.from}</span>
                      <ArrowRight className="h-3 w-3 text-primary opacity-60" />
                      <span className="text-sm font-black text-foreground">{stat.to}</span>
                    </div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border bg-muted/40 py-2.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={() => { onUpgrade?.(suggestedPlan); onClose(); }}
                  className="flex-[2] rounded-lg bg-primary py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  Upgrade to {plan.name}
                </button>
              </div>

              {/* Trust */}
              <div className="mt-2.5 flex items-center justify-center gap-4 text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider">
                <span>Cancel anytime</span>
                <span>·</span>
                <span>14-day refund</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
