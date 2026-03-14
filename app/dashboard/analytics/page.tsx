"use client";

import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { AdvancedAnalytics } from "@/components/advanced-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Lock } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { plan, isLoading } = useUserPlan();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (plan !== 'pro') {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-gold mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">
            <span className="gradient-gold-teal">Pro Feature</span>
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Advanced analytics with detailed insights is available exclusively for Pro members.
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="btn-gold inline-flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto aurora-bg noise-overlay min-h-screen">
      <div className="mb-6 lg:mb-10 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Crown className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Advanced <span className="gradient-gold-teal">Analytics</span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your content performance and SEO metrics over time.
        </p>
      </div>

      <div className="relative z-10">
        <AdvancedAnalytics />
      </div>
    </div>
  );
}
