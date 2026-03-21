"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold font-display mb-4" style={{ color: 'var(--text-1)' }}>Privacy Policy</h1>
        <p className="text-sm mb-12" style={{ color: 'var(--text-3)' }}>Last updated: March 21, 2026</p>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>1. Information We Collect</h2>
            <p style={{ color: 'var(--text-2)' }}>
              We collect information you provide directly to us when you create an account, request customer support, or purchase a subscription. This includes your name, email address, website URLs, and the content drafts you generate.
            </p>
            <p className="mt-2" style={{ color: 'var(--text-2)' }}>
              We do not directly collect or store your full credit card information. Payments are processed securely via our Merchant of Record, Paddle.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>2. How We Use Information</h2>
            <p style={{ color: 'var(--text-2)' }}>
              We use the data we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-1" style={{ color: 'var(--text-2)' }}>
              <li>Provide, maintain, and improve our Service.</li>
              <li>Provide prompts to external AI processors to generate your requested content.</li>
              <li>Process transactions and send related data (like invoices) via our payment processor.</li>
              <li>Respond to your technical or account support requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>3. AI Processing & Third-Party Processors</h2>
            <p style={{ color: 'var(--text-2)' }}>
              To deliver our service, we share data securely with essential third-party data processors:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4" style={{ color: 'var(--text-2)' }}>
              <li>
                <strong>AI Partners (Google Gemini, OpenAI via OpenRouter):</strong> We pass your queries, outlines, and partial drafts to these APIs. <strong>Your data is strictly processed and is never used to train their foundational models.</strong>
              </li>
              <li>
                <strong>Payment Processor (Paddle.com):</strong> Our order process is conducted by our online reseller Paddle.com, the Merchant of Record. Paddle processes your personal and financial data to fulfill orders, handle taxes, and prevent fraud. See{" "}
                <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Paddle&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong>Database & Authentication (Google Firebase/GCP):</strong> Used to securely store your user credentials and saved article drafts.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>4. Cookies and Tracking Technologies</h2>
            <p style={{ color: 'var(--text-2)' }}>
              We use necessary cookies for authentication (keeping you logged in) and security. We may use strictly anonymous analytics counters to improve the site. We do not sell your data or deploy cross-site tracking cookies for advertising (no third-party ad-tracking).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>5. Your User Rights (GDPR & CCPA/CPRA)</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Depending on where you reside (e.g., the European Economic Area, UK, or California, USA), you have specific rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4" style={{ color: 'var(--text-2)' }}>
              <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> You can edit inaccurate data inside your account dashboard.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You can request that we delete your account and all associated data.</li>
              <li><strong>Right to Data Portability:</strong> You can request your content exports.</li>
              <li><strong>Do Not Sell My Personal Information (CCPA):</strong> We do not sell your personal information to third parties, ever.</li>
            </ul>
            <p className="mt-4" style={{ color: 'var(--text-2)' }}>
              To exercise any of these rights, email us at <a href="mailto:privacy@pubwize.com" className="text-gold hover:underline">privacy@pubwize.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>6. Data Retention and Security</h2>
            <p style={{ color: 'var(--text-2)' }}>
              We retain your information as long as your account is active. If you delete your account, we securely delete all your generated texts and data from our active databases within 30 days. We use enterprise-grade encryption in transit (HTTPS/TLS) and at rest (AES-256 via Google Cloud) to protect your assets.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>7. Contact Us</h2>
            <p style={{ color: 'var(--text-2)' }}>
              If you have any questions or concerns about how your data is handled, you can reach our Data Protection Officer at:
            </p>
            <div className="mt-4 p-4 rounded-lg border border-border/50 bg-black/20" style={{ color: 'var(--text-2)' }}>
              <p><strong>Email:</strong> <a href="mailto:privacy@pubwize.com" className="text-gold hover:underline">privacy@pubwize.com</a></p>
              <p className="mt-2"><strong>Data Controller:</strong><br />
                Pubwize<br />
                488 Zone E Kalengwa South<br />
                Kalulushi, Copperbelt 10101<br />
                Zambia</p>
            </div>
            <p className="mt-4" style={{ color: 'var(--text-2)' }}>
              For queries related to your payment data processing, please contact our Merchant of Record, Paddle, at{" "}
              <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">paddle.net</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
