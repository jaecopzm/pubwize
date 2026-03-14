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
            <img src="/PubWize.png" alt="Pubwize" className="h-24" />
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
        <p className="text-sm mb-12" style={{ color: 'var(--text-3)' }}>Last updated: March 8, 2026</p>

        <div className="space-y-8 prose prose-invert max-w-none">
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>How to Request a Refund</h2>
            <p style={{ color: 'var(--text-2)' }}>
              To request a refund, please contact our support team at{" "}
              <a href="mailto:support@pubwize.com" className="underline" style={{ color: 'var(--gold)' }}>
                support@pubwize.com
              </a>{" "}
              with your account email and reason for the refund request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Processing Time</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Refunds are typically processed within 5-7 business days. The refund will be credited to the original payment method used for the purchase. Payments are processed by Dodo Payments, our authorised reseller and Merchant of Record.
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
              For questions about our refund policy or to request a refund, contact us at{" "}
              <a href="mailto:support@pubwize.com" className="underline" style={{ color: 'var(--gold)' }}>
                support@pubwize.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
