"use client";

import { X, Zap, Check } from "lucide-react";
import { PLANS, formatPrice, type PlanTier } from "@/lib/pricing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  reason?: string;
  onUpgrade?: (plan: PlanTier) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  reason,
  onUpgrade,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const suggestedPlan: PlanTier = currentPlan === 'free' ? 'starter' : 'pro';
  const plan = PLANS[suggestedPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold font-display mb-1 sm:mb-2">
              Upgrade to {plan.name}
            </h2>
            {reason && (
              <p className="text-xs sm:text-sm text-text-3 leading-relaxed">{reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-1 p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Plan Highlight */}
        <div className="rounded-lg sm:rounded-xl border border-gold/30 bg-gold/5 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold truncate">{plan.name} Plan</h3>
              <p className="text-xs sm:text-sm text-text-3 truncate">{plan.description}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 sm:gap-2 mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.price)}</span>
            <span className="text-xs sm:text-sm text-text-3">/month</span>
          </div>

          <p className="text-[10px] sm:text-xs text-teal mb-3 sm:mb-4">
            Or {formatPrice(plan.annualPrice)}/year (save {formatPrice(plan.price * 12 - plan.annualPrice)})
          </p>

          {/* Key Features */}
          <div className="space-y-1.5 sm:space-y-2">
            {plan.features.slice(0, 5).map((feature, index) => (
              <div key={index} className="flex items-start gap-1.5 sm:gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-text-2 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="mb-4 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">What you'll get:</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3">
              <div className="text-xl sm:text-2xl font-bold text-gold mb-0.5 sm:mb-1">
                {plan.limits.articlesPerMonth}
              </div>
              <div className="text-[10px] sm:text-xs text-text-3">Articles/month</div>
              <div className="text-[9px] sm:text-[10px] text-teal mt-0.5 sm:mt-1">
                vs {PLANS[currentPlan].limits.articlesPerMonth} now
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3">
              <div className="text-xl sm:text-2xl font-bold text-lilac mb-0.5 sm:mb-1">
                {plan.limits.aiImprovementsPerMonth}
              </div>
              <div className="text-[10px] sm:text-xs text-text-3">AI Improvements</div>
              <div className="text-[9px] sm:text-[10px] text-teal mt-0.5 sm:mt-1">
                vs {PLANS[currentPlan].limits.aiImprovementsPerMonth} now
              </div>
            </div>
          </div>
        </div>


        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 sm:px-4 py-3 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-card hover:bg-card/80 font-semibold text-xs sm:text-sm transition-all active:scale-95 touch-manipulation min-h-[44px]"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              if (onUpgrade) {
                onUpgrade(suggestedPlan);
              }
              onClose();
            }}
            className="flex-1 px-3 sm:px-4 py-3 sm:py-3 rounded-lg sm:rounded-xl bg-gold text-obsidian hover:bg-gold/90 font-semibold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 touch-manipulation min-h-[44px]"
          >
            Upgrade Now
          </button>
        </div>

        {/* Trust Signals */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-text-3">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal shrink-0" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal shrink-0" />
              <span>14-day refund</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
