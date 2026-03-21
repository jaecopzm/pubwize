"use client";

import { Check, Zap, Crown, Gift, Clock, Shield } from "lucide-react";
import { PLANS, formatPrice, getAnnualSavings, type PlanTier } from "@/lib/pricing";
import { useState, useTransition } from "react";
import { getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PricingCardsProps {
  currentPlan?: PlanTier;
  onSelectPlan?: (plan: PlanTier, isAnnual: boolean) => void;
  customerEmail?: string;
  onSuccess?: () => void;
}

export function PricingCards({ currentPlan = 'free', onSelectPlan, customerEmail, onSuccess }: PricingCardsProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isPending, startTransition] = useTransition();
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSelectPlan = (planId: PlanTier) => {
    console.log('Plan selected:', planId);
    
    if (planId === 'free') {
      if (onSelectPlan) onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    // Always open Paddle checkout for paid plans
    if (onSelectPlan) {
      onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    console.log('User state:', { loading, user: !!user });

    if (!loading && !user) {
      console.log('Redirecting to signup with plan:', planId);
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
        console.error('[PricingCards] Could not open checkout:', err);
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold font-display mb-2 sm:mb-3 lg:mb-4 px-2">
          Simple, <span className="gradient-gold-teal">Transparent Pricing</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-text-2 max-w-2xl mx-auto px-4">
          Start free, upgrade when you need more. No hidden fees, cancel anytime.
        </p>
        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-text-3">
            <Clock className="h-3.5 w-3.5 text-teal" />
            7-day free trial on paid plans
          </span>
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-text-3">
            <Shield className="h-3.5 w-3.5 text-gold" />
            14-day money-back guarantee
          </span>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-12 px-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-xs sm:text-sm lg:text-base font-semibold transition-all active:scale-95 touch-manipulation ${billingCycle === 'monthly'
            ? 'bg-gold text-obsidian'
            : 'text-text-2 hover:text-text-1'
            }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`relative px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-xs sm:text-sm lg:text-base font-semibold transition-all active:scale-95 touch-manipulation ${billingCycle === 'annual'
            ? 'bg-gold text-obsidian'
            : 'text-text-2 hover:text-text-1'
            }`}
        >
          Annual
          <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-teal text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
            Save 17%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
        {(Object.keys(PLANS) as PlanTier[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrentPlan = currentPlan === planId;
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.price;
          const displayPrice = billingCycle === 'annual' ? price / 12 : price;
          const savings = billingCycle === 'annual' ? getAnnualSavings(planId) : 0;
          const isPaid = planId === 'starter' || planId === 'pro';

          return (
            <div
              key={planId}
              className={`relative rounded-xl sm:rounded-2xl border p-4 sm:p-6 lg:p-8 transition-all hover:-translate-y-1 hover:shadow-2xl ${plan.popular
                ? 'border-gold bg-gold/5 shadow-xl shadow-gold/20'
                : 'border-border bg-card'
                } ${isCurrentPlan ? 'ring-2 ring-teal' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-gold text-obsidian px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                    <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>MOST POPULAR</span>
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <div className="flex items-center gap-1 bg-teal/10 text-teal border border-teal/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>Current</span>
                  </div>
                </div>
              )}

              {/* Plan Icon */}
              <div className="mb-3 sm:mb-4">
                {planId === 'free' && (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-teal/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-teal" />
                  </div>
                )}
                {planId === 'starter' && (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gold/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
                  </div>
                )}
                {planId === 'pro' && (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-lilac/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-lilac" />
                  </div>
                )}
              </div>

              {/* Plan Name */}
              <h3 className="text-xl sm:text-2xl font-bold font-display mb-1 sm:mb-2">{plan.name}</h3>
              <p className="text-xs sm:text-sm text-text-3 mb-4 sm:mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                    {formatPrice(displayPrice)}
                  </span>
                  {price > 0 && (
                    <span className="text-xs sm:text-sm text-text-3">
                      /{billingCycle === 'annual' ? 'mo' : 'month'}
                    </span>
                  )}
                </div>
                {billingCycle === 'annual' && price > 0 && (
                  <p className="text-[10px] sm:text-xs text-teal mt-1">
                    {formatPrice(price)} billed annually · Save {formatPrice(savings)}
                  </p>
                )}
                {/* 7-day trial pill for paid plans */}
                {isPaid && !isCurrentPlan && (
                  <p className="flex items-center gap-1 text-[10px] sm:text-xs text-teal/80 mt-2">
                    <Clock className="h-3 w-3" />
                    7-day free trial included
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(planId)}
                disabled={isCurrentPlan || (isPaid && isPending)}
                className={`w-full py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base transition-all mb-3 sm:mb-4 ${plan.popular
                  ? 'bg-gold text-obsidian hover:bg-gold/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : isCurrentPlan
                    ? 'bg-teal/10 text-teal border border-teal/30 cursor-not-allowed'
                    : 'bg-card border border-border hover:border-gold/50 hover:bg-gold/5'
                  } disabled:opacity-50 active:scale-95 touch-manipulation`}
              >
                {isPending && isPaid && !isCurrentPlan ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Preparing...
                  </span>
                ) : isCurrentPlan
                  ? 'Current Plan'
                  : planId === 'free'
                    ? 'Get Started Free'
                    : 'Start Free Trial'}
              </button>

              {/* 14-day guarantee note under paid CTA */}
              {isPaid && !isCurrentPlan && (
                <p className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-text-3 mb-4 sm:mb-5">
                  <Shield className="h-3 w-3" />
                  14-day money-back guarantee
                </p>
              )}

              {/* Features */}
              <div className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-teal shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-text-2 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 sm:mt-12 lg:mt-16 text-center px-4">
        <p className="text-xs sm:text-sm text-text-3 mb-3 sm:mb-4">
          All plans include WordPress publishing, social media repurposing, content calendar, and SEO optimization.
        </p>
        <p className="text-xs sm:text-sm text-text-3 mb-2">
        Payments securely processed by Paddle.com — our authorised Merchant of Record.
        </p>
        <p className="text-xs sm:text-sm text-text-3">
          Need more?{" "}
          <a href="mailto:support@pubwize.com" className="text-gold hover:underline">
            Contact us
          </a>{" "}
          for custom enterprise plans.
        </p>
      </div>
    </div>
  );
}
