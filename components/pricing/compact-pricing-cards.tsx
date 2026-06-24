"use client";

import { Check, Zap, Crown, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PLANS, formatPrice, type PlanTier } from "@/lib/pricing";
import { useState, useTransition } from "react";
import { getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

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
      trackEvent("pricing_cta_clicked", {
        location: "compact_pricing_cards",
        plan: planId,
        billing_cycle: billingCycle,
        authenticated: !!user,
        destination: "free",
      });
      if (onSelectPlan) onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    if (onSelectPlan) {
      trackEvent("pricing_cta_clicked", {
        location: "compact_pricing_cards",
        plan: planId,
        billing_cycle: billingCycle,
        authenticated: !!user,
        destination: "in_app_upgrade",
      });
      onSelectPlan(planId, billingCycle === 'annual');
      return;
    }

    if (!loading && !user) {
      trackEvent("pricing_cta_clicked", {
        location: "compact_pricing_cards",
        plan: planId,
        billing_cycle: billingCycle,
        authenticated: false,
        destination: "sign_up",
      });
      trackEvent("signup_intent_started", {
        source: "compact_pricing_cards",
        plan: planId,
        billing_cycle: billingCycle,
      });
      router.push(`/sign-up?plan=${planId}&billing=${billingCycle}`);
      return;
    }

    startTransition(async () => {
      try {
        if (!window.Paddle) {
          toast.error("Payment system not loaded. Please refresh the page.");
          return;
        }

        const priceId = getPaddlePriceId(planId as 'starter' | 'pro', billingCycle);
        trackEvent("pricing_cta_clicked", {
          location: "compact_pricing_cards",
          plan: planId,
          billing_cycle: billingCycle,
          authenticated: true,
          destination: "checkout",
        });
        trackEvent("checkout_opened", {
          source: "compact_pricing_cards",
          plan: planId,
          billing_cycle: billingCycle,
          price_id: priceId,
        });
        
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
    <div style={{ width: "100%", maxWidth: "1160px", margin: "0 auto" }}>
      {/* Billing Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "48px" }}>
        <button
          onClick={() => setBillingCycle('monthly')}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            background: billingCycle === 'monthly' ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
            color: billingCycle === 'monthly' ? "#fff" : "var(--muted-foreground)",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          style={{
            position: "relative",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            background: billingCycle === 'annual' ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
            color: billingCycle === 'annual' ? "#fff" : "var(--muted-foreground)",
          }}
        >
          Annual
          <span style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            background: "#4ade80",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "999px",
          }}>
            Save 17%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
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
              style={{
                position: "relative",
                borderRadius: "12px",
                border: plan.popular ? "1px solid rgba(99,102,241,0.5)" : "1px solid var(--border)",
                padding: "32px",
                background: plan.popular ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,238,0.05))" : "var(--card)",
                transform: plan.popular ? "scale(1.05)" : "scale(1)",
                boxShadow: plan.popular ? "0 20px 60px rgba(99,102,241,0.2)" : "none",
                transition: "all 0.3s",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  color: "#fff",
                  padding: "4px 16px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  <Crown style={{ width: "12px", height: "12px" }} />
                  POPULAR
                </div>
              )}

              {/* Icon */}
              <div style={{ marginBottom: "20px" }}>
                {planId === 'free' && (
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(34,211,238,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Gift style={{ width: "24px", height: "24px", color: "#22d3ee" }} />
                  </div>
                )}
                {planId === 'starter' && (
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap style={{ width: "24px", height: "24px", color: "#6366f1" }} />
                  </div>
                )}
                {planId === 'pro' && (
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Crown style={{ width: "24px", height: "24px", color: "#a78bfa" }} />
                  </div>
                )}
              </div>

              {/* Plan Name & Price */}
              <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", color: "var(--foreground)", fontFamily: "'Syne', sans-serif" }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "24px" }}>
                <span style={{ fontSize: "48px", fontWeight: 900, color: "var(--foreground)", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>{formatPrice(price)}</span>
                {price > 0 && <span style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>/mo</span>}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(planId)}
                disabled={isCurrentPlan || (isPaid && isPending)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "15px",
                  marginBottom: "24px",
                  border: "none",
                  cursor: isCurrentPlan ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  background: plan.popular
                    ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                    : isCurrentPlan
                    ? "rgba(74,222,128,0.1)"
                    : "var(--card)",
                  color: plan.popular ? "#fff" : isCurrentPlan ? "#4ade80" : "var(--foreground)",
                  opacity: (isCurrentPlan || (isPaid && isPending)) ? 0.5 : 1,
                  boxShadow: !plan.popular && !isCurrentPlan ? "0 0 0 1px var(--border)" : "none",
                }}
              >
                {isPending && isPaid && !isCurrentPlan ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ width: "16px", height: "16px", border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Loading...
                  </span>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : planId === 'free' ? (
                  'Start Free'
                ) : (
                  'Get Started'
                )}
              </motion.button>

              {/* Key Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {PLAN_HIGHLIGHTS[planId].map((feature, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Check style={{ width: "16px", height: "16px", color: "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>{feature}</span>
                  </div>
                ))}
                {planId === 'pro' && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Sparkles style={{ width: "16px", height: "16px", color: "#6366f1", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>Advanced analytics</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
          All plans include WordPress publishing, SEO optimization, and social media tools.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
