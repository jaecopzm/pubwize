"use client";

import { Crown, X, Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border max-w-2xl w-full card-premium overflow-hidden"
        style={{
          borderColor: "rgba(245,166,35,0.3)",
          background: "var(--surface-1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative p-8 pb-6"
          style={{
            background: "linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(0,217,180,0.1) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-1)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl shadow-gold"
              style={{ background: "var(--gold)", color: "#0a0700" }}
            >
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text-1)" }}>
                Upgrade to Pro
              </h2>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                {reason || "Unlock unlimited potential"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Starter */}
            <div
              className="rounded-xl border p-6"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "var(--surface-2)",
              }}
            >
              <div className="mb-4">
                <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>
                  Starter
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-1)" }}>
                    $29
                  </span>
                  <span className="font-mono-dm text-xs" style={{ color: "var(--text-3)" }}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  "15 articles per month",
                  "Basic SEO optimization",
                  "WordPress publishing",
                  "Email support",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--teal)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div
              className="rounded-xl border p-6 relative"
              style={{
                borderColor: "rgba(245,166,35,0.5)",
                background: "rgba(245,166,35,0.08)",
              }}
            >
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 badge-gold text-[10px] px-3 py-1"
              >
                MOST POPULAR
              </div>

              <div className="mb-4">
                <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--text-1)" }}>
                  Pro
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: "var(--gold)" }}>
                    $79
                  </span>
                  <span className="font-mono-dm text-xs" style={{ color: "var(--text-3)" }}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  "60 articles per month",
                  "Advanced SEO with SERP data",
                  "Priority AI generation",
                  "Bulk operations",
                  "Priority support",
                  "Custom templates",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  router.push("/dashboard/settings");
                  onClose();
                }}
                className="btn-gold w-full mt-6"
              >
                <Zap className="h-4 w-4" />
                Upgrade Now
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="font-mono-dm text-xs mb-2" style={{ color: "var(--text-3)" }}>
              14-day money-back guarantee • Cancel anytime
            </p>
            <button
              onClick={onClose}
              className="text-sm font-semibold underline"
              style={{ color: "var(--text-2)" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
