"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundsPage() {
  return (
    <div className="min-h-screen aurora-bg noise-overlay">
      {/* Navigation */}
      <nav className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--surface-1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/PubWize.png" alt="Pubwize" className="h-12" />
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold font-display mb-4" style={{ color: 'var(--text-1)' }}>Refund Policy</h1>
        <p className="text-sm mb-12" style={{ color: 'var(--text-3)' }}>Last updated: March 21, 2026</p>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Overview</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Pubwize uses Paddle.com as our Merchant of Record. Paddle handles all payment processing, tax compliance, and buyer support. This policy works alongside{" "}
              <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gold)' }}>
                Paddle&apos;s Refund Policy
              </a>
              , which also applies to your purchase. Where local consumer protection laws grant you stronger rights, those rights always apply.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>14-Day Money-Back Guarantee</h2>
            <p style={{ color: 'var(--text-2)' }}>
              We offer a 14-day money-back guarantee for all new paid subscriptions. If you&apos;re not satisfied with Pubwize within the first 14 days of your initial purchase, we&apos;ll provide a full refund — no questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>7-Day Free Trial</h2>
            <p style={{ color: 'var(--text-2)' }}>
              All paid plans (Starter and Pro) include a 7-day free trial. You will not be charged until the trial period ends. You may cancel at any time during the trial without incurring any charge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Eligibility</h2>
            <p style={{ color: 'var(--text-2)' }}>
              To be eligible for a refund:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li>The refund request must be made within 14 days of your initial subscription purchase</li>
              <li>This applies to first-time subscribers only</li>
              <li>Renewal charges are not eligible for refunds</li>
              <li>Accounts found to be abusing the refund policy may be denied</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Statutory Withdrawal Rights</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Depending on your country, you may have additional statutory rights:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li><strong>EU / EEA / UK / Switzerland:</strong> 14-day right to withdraw from your first purchase or first subscription payment</li>
              <li><strong>Turkey / Israel:</strong> 14-day right to withdraw</li>
              <li><strong>South Korea / Brazil / China / Canada:</strong> 7-day unconditional right to cancel</li>
              <li><strong>Singapore:</strong> 5-day unconditional right to cancel</li>
            </ul>
            <p className="mt-3" style={{ color: 'var(--text-2)' }}>
              These rights are enforced by Paddle as the Merchant of Record. See{" "}
              <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gold)' }}>
                Paddle&apos;s full Refund Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>How to Request a Refund</h2>
            <p style={{ color: 'var(--text-2)' }}>
              To request a refund, you can:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li>Use the <strong>"View receipt"</strong> or <strong>"Manage subscription"</strong> link in your Paddle receipt email</li>
              <li>Visit{" "}
                <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gold)' }}>
                  paddle.net
                </a>{" "}
                and select "Request refund"
              </li>
              <li>Email us at{" "}
                <a href="mailto:support@pubwize.com" className="underline" style={{ color: 'var(--gold)' }}>
                  support@pubwize.com
                </a>{" "}
                and we&apos;ll assist you
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Processing Time</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Refunds are processed by Paddle within 14 days of approval. The refund will be credited to the original payment method used for the purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Cancellations</h2>
            <p style={{ color: 'var(--text-2)' }}>
              You can cancel your subscription at any time from your account settings. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li>You&apos;ll retain access to paid features until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>Your account will automatically downgrade to the free tier</li>
              <li>Cancellations do not automatically trigger refunds unless within the 14-day guarantee period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Exceptions</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Refunds may be denied in cases of:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li>Violation of our Terms of Service</li>
              <li>Fraudulent or abusive behavior</li>
              <li>Excessive usage that violates fair use policies</li>
              <li>Requests made after the 14-day guarantee period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Contact</h2>
            <p style={{ color: 'var(--text-2)' }}>
              For questions about our refund policy, contact us at{" "}
              <a href="mailto:support@pubwize.com" className="underline" style={{ color: 'var(--gold)' }}>
                support@pubwize.com
              </a>
              . For direct payment or billing support, visit{" "}
              <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gold)' }}>
                paddle.net
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
