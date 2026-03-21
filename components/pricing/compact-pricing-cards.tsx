"use client";

import { Check, Zap, Crown, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PLANS, formatPrice, type PlanTier } from "@/lib/pricing";
import { useState, useTransition } from "react";
import { getPaddlePriceId } from "@/lib/paddle";
import { createPaddleCheckoutSession } from "@/app/actions/paddle";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CompactPricingCardsProps {
  currentPlan?: PlanTier;
  onSelectPlan?: (plan: PlanTier, isAnnual: boolean) => void;
  customerEmail?: string;
  onSuccess?: () => void;
}

const PLAN_HIGHLIGHTS = {
  free: ['5 articles/mo', 'Basic AI workflow', '1 site'],
  starter: ['25 articles/mo', 'Full AI features', '3 sites'],
  pro: ['100 articles/mo', 'Priority AI', '10 sites', 'Bulk ops'],
};

export function CompactPricingCards({ currentPlan = 'free', onSelectPlan, customerEmail, onSuccess }: CompactPricingCardsProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isPending, startTransition] = useTransition();
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSelectPlan = (planId: PlanTier) => {
    if (planId === 'free') {
      if (onSelectPlan) onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    if (onSelectPlan) {
      onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    if (!loading && !user) {
      router.push(`/auth/signup?plan=${planId}&billing=${billingCycle}`);
      return;
    }

    startTransition(async () => {
      try {
        if (!window.Paddle) {
          toast.error("Payment system not loaded. Please refresh the page.");
          return;
        }

        const priceId = getPaddlePriceId(planId as 'starter' | 'pro', billingCycle);
        
        window.Paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          settings: {
            displayMode: "overlay",
            successUrl: `${window.location.origin}/dashboard/settings?tab=billing&success=true`,
          },
          customData: user?.uid ? { userId: user.uid } : undefined,
          customer: customerEmail || user?.email ? { email: customerEmail || user?.email } : undefined,
        });
        
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error("An unexpected error occurred.");
        console.error(err);
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Choose Your <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Plan</span>
        </h2>
        <p className="text-sm text-muted-foreground">Start free, upgrade anytime. Cancel whenever.</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            billingCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`relative px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            billingCycle === 'annual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Save 17%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {(Object.keys(PLANS) as PlanTier[]).map((planId, index) => {
          const plan = PLANS[planId];
          const isCurrentPlan = currentPlan === planId;
          const price = billingCycle === 'annual' ? plan.annualPrice / 12 : plan.price;
          const isPaid = planId !== 'free';

          return (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border p-6 transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent shadow-lg scale-105'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    <Crown className="h-3 w-3" />
                    POPULAR
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="mb-4">
                {planId === 'free' && (
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-cyan-500" />
                  </div>
                )}
                {planId === 'starter' && (
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                )}
                {planId === 'pro' && (
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-violet-500" />
                  </div>
                )}
              </div>

              {/* Plan Name & Price */}
              <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{formatPrice(price)}</span>
                {price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(planId)}
                disabled={isCurrentPlan || (isPaid && isPending)}
                className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/25'
                    : isCurrentPlan
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 cursor-not-allowed'
                    : 'bg-card border-2 border-border hover:border-primary'
                } disabled:opacity-50`}
              >
                {isPending && isPaid && !isCurrentPlan ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : planId === 'free' ? (
                  'Start Free'
                ) : (
                  'Start Trial'
                )}
              </motion.button>

              {/* Key Features */}
              <div className="space-y-3">
                {PLAN_HIGHLIGHTS[planId].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
                {planId === 'pro' && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">Advanced analytics</span>
                  </div>
                )}
              </div>

              {/* View All Features Link */}
              <button className="mt-4 text-xs text-primary hover:underline">
                View all features →
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          All plans include WordPress publishing, SEO optimization, and social media tools.
        </p>
      </div>
    </div>
  );
}
