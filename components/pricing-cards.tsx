"use client";

import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanTier } from "@/lib/pricing";
import { useUserPlan } from "@/lib/hooks/use-user-plan";

export function PricingCards() {
  const planData = useUserPlan();

  const plans = [
    {
      tier: 'free' as const,
      name: 'Free',
      price: 0,
      description: 'Perfect for trying out Pubwize',
      icon: Sparkles,
      features: [
        '5 articles per month',
        '3 AI optimizations per month',
        'SEO scores up to 70/100',
        'Basic SEO scoring',
        'Manual content editing',
      ],
      cta: 'Current Plan',
      highlighted: false,
    },
    {
      tier: 'starter' as const,
      name: 'Starter',
      price: 29,
      description: 'For serious content creators',
      icon: Zap,
      features: [
        '15 articles per month',
        '15 AI optimizations per month',
        'SEO scores up to 85/100',
        'Advanced SEO analysis',
        'Priority email support',
      ],
      cta: 'Upgrade to Starter',
      highlighted: true,
    },
    {
      tier: 'pro' as const,
      name: 'Pro',
      price: 99,
      description: 'For agencies and power users',
      icon: Crown,
      features: [
        '60 articles per month',
        'Unlimited AI optimizations',
        'SEO scores up to 100/100',
        'Competitor analysis',
        'Bulk operations',
        'Priority support',
      ],
      cta: 'Upgrade to Pro',
      highlighted: false,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrentPlan = planData.planTier === plan.tier;
        
        return (
          <div
            key={plan.tier}
            className={cn(
              "relative rounded-2xl border p-6 transition-all",
              plan.highlighted
                ? "border-violet-500/50 bg-gradient-to-b from-violet-600/10 to-purple-600/5 shadow-lg shadow-violet-500/10"
                : "border-border/60 bg-card/50",
              isCurrentPlan && "ring-2 ring-violet-500/30"
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  plan.highlighted ? "bg-violet-500/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    plan.highlighted ? "text-violet-400" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              </div>
              
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="mb-6 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={isCurrentPlan}
              className={cn(
                "w-full rounded-lg py-2.5 text-sm font-semibold transition-all",
                isCurrentPlan
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : plan.highlighted
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25"
                  : "bg-card border border-border/60 text-foreground hover:bg-accent"
              )}
            >
              {isCurrentPlan ? 'Current Plan' : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
