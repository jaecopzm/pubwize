"use client";

import { useRouter } from "next/navigation";
import { PricingCards } from "@/components/pricing";
import { ArrowLeft } from "lucide-react";

import type { PlanTier } from "@/lib/pricing";

export default function PricingPage() {
  const router = useRouter();

  const handleSelectFreePlan = (plan: PlanTier, isAnnual: boolean) => {
    console.log('handleSelectFreePlan called with:', plan, isAnnual);
    try {
      if (plan === 'free') {
        console.log('Navigating to /sign-up');
        window.location.href = '/sign-up';
      } else {
        const url = `/sign-up?plan=${plan}&billing=${isAnnual ? 'annual' : 'monthly'}`;
        console.log('Navigating to:', url);
        window.location.href = url;
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
      <div className="min-h-screen aurora-bg noise-overlay">
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 font-display">
            Choose Your <span className="gradient-gold-teal">Plan</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Start free and scale your content creation with AI-powered SEO tools
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <PricingCards
            currentPlan="free"
            onSuccess={() => router.push('/dashboard')}
          />
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="card-premium rounded-xl sm:rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 font-display">
              Ready to Scale Your Content?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-xl mx-auto">
              Start free, upgrade anytime. No credit card required.
            </p>
            <button
              onClick={() => router.push('/sign-up')}
              className="btn-gold text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto"
            >
              Start Free Today
            </button>
          </div>
        </div>
      </div>
  );
}
