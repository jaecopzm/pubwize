"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, CreditCard } from "lucide-react";

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold font-display mb-4" style={{ color: 'var(--text-1)' }}>Contact Us</h1>
        <p className="text-base mb-12" style={{ color: 'var(--text-3)' }}>
          Have questions? We're here to help.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tech Support */}
          <div className="card-premium p-8 border border-border flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gold/10 text-gold shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Product Support</h2>
            </div>
            <p className="mb-4 flex-grow" style={{ color: 'var(--text-2)' }}>
              For technical support regarding the Pubwize platform, account issues, bug reports, or feature requests:
            </p>
            <a
              href="mailto:support@pubwize.com"
              className="text-lg font-semibold underline"
              style={{ color: 'var(--gold)' }}
            >
              support@pubwize.com
            </a>
            <p className="mt-4 text-sm" style={{ color: 'var(--text-3)' }}>
              We typically respond within 24 hours on business days.
            </p>
          </div>

          {/* Billing Support (Dodo Payments) */}
          <div className="card-premium p-8 border border-border flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-teal/10 text-teal shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Billing Support</h2>
            </div>
            <p className="mb-4 flex-grow" style={{ color: 'var(--text-2)' }}>
              Our order process and payment processing is conducted by our payment partner, Dodo Payments. They act as the Merchant of Record for all orders.
            </p>
            <p className="mb-4" style={{ color: 'var(--text-2)' }}>
              For billing questions, payment issues, or charge inquiries, please reach out to Dodo Payments support or contact us and we can assist.
            </p>
          </div>

          {/* Business Address */}
          <div className="card-premium p-8 border border-border md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-lilac/10 text-lilac shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Corporate Headquarters</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Address</p>
                <p style={{ color: 'var(--text-2)' }}>
                  Pubwize<br />
                  488 Zone E Kalengwa South<br />
                  Kalulushi, Copperbelt 10101<br />
                  Zambia
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Other Inquiries</p>
                <ul className="space-y-2" style={{ color: 'var(--text-2)' }}>
                  <li>
                    <strong>Sales:</strong>{" "}
                    <a href="mailto:sales@pubwize.com" className="underline hover:text-gold transition-colors">sales@pubwize.com</a>
                  </li>
                  <li>
                    <strong>Legal:</strong>{" "}
                    <a href="mailto:legal@pubwize.com" className="underline hover:text-gold transition-colors">legal@pubwize.com</a>
                  </li>
                  <li>
                    <strong>Partnerships:</strong>{" "}
                    <a href="mailto:partnerships@pubwize.com" className="underline hover:text-gold transition-colors">partnerships@pubwize.com</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
