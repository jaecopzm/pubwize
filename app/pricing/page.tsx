"use client";

import { useRouter } from "next/navigation";
import { PricingCards } from "@/components/pricing";
import { ArrowLeft, Quote } from "lucide-react";
import { SocialProofBadges } from "@/components/social-proof-badges";

import type { PlanTier } from "@/lib/pricing";

const testimonials = [
  {
    quote: "PubWize cut my content creation time from 4 hours to 30 minutes. The ROI is insane!",
    author: "Sarah K.",
    role: "Food Blogger",
    avatar: "SK"
  },
  {
    quote: "I went from 2 articles a week to 10. My traffic doubled in 3 months.",
    author: "Mike Chen",
    role: "Tech Writer",
    avatar: "MC"
  },
  {
    quote: "The SEO optimization is incredible. Every article ranks on page 1 now.",
    author: "Emma Rodriguez",
    role: "Marketing Agency",
    avatar: "ER"
  }
];

export default function PricingPage() {
  const router = useRouter();

  const handleSelectFreePlan = (plan: PlanTier, _isAnnual: boolean) => {
    if (plan === 'free') {
      router.push('/login');
    }
  };

  return (
      <div className="min-h-screen aurora-bg noise-overlay">
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-text-3 hover:text-text-1 transition-colors active:scale-95 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Choose Your <span className="gradient-gold-teal">Growth Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Join 500+ content creators scaling their SEO with AI
          </p>
          <SocialProofBadges />
        </div>

        {/* Pricing Cards */}
        <PricingCards
          currentPlan="free"
          onSelectPlan={handleSelectFreePlan}
          onSuccess={() => router.push('/dashboard')}
        />

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            Loved by Content Creators
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="card-premium rounded-xl border border-border bg-card p-6">
                <Quote className="h-8 w-8 text-gold mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="card-premium rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-8">
            <h2 className="text-3xl font-bold mb-4">
              Ready to 10x Your Content?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start free, upgrade anytime. No credit card required.
            </p>
            <button
              onClick={() => router.push('/auth/signup')}
              className="btn-gold text-lg px-8 py-3"
            >
              Start Free Today
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-gold font-medium">Limited time:</span> Get 20% off your first month on any paid plan
            </p>
          </div>
        </div>
      </div>
  );
}
