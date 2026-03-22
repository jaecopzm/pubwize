"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  User,
  CheckCircle2,
  Sparkles,
  FileText,
  Globe,
  TrendingUp,
  Plus,
  Crown,
  Mail,
  Calendar,
  BarChart3,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { WordPressConnectionDialog, WordPressSitesList } from "@/components/wordpress";
import { PricingCards } from "@/components/pricing";
import { BillingManagement } from "@/components/billing-management";
import { getPaddlePriceId } from "@/lib/paddle";
import { createPaddleCheckoutSession, createPaddleCustomerPortalSession } from "@/app/actions/paddle";
import { toast } from "sonner";
import { useTransition } from "react";
import type { WordPressSite, PlanTier } from "@/lib/types";
import { PLANS } from "@/lib/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CurrentUser {
  email: string;
  displayName?: string;
  planTier?: string;
  planStatus?: string;
  articleCountThisPeriod?: number;
  createdAt?: string;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  status?: string;
  currentPeriodEnd?: string;
}

type SettingsTab = 'account' | 'brand_voice' | 'billing' | 'integrations';

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [showWordPressDialog, setShowWordPressDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        displayName: clerkUser.fullName || undefined,
        createdAt: new Date(clerkUser.createdAt).toISOString(),
      });
      fetchUserPlan();
      fetchWordPressSites();
    }
    setLoading(!isLoaded);
  }, [isLoaded, clerkUser]);

  // Handle auto-checkout from signup redirect
  useEffect(() => {
    const checkoutPlan = searchParams.get('checkout');
    const checkoutBilling = searchParams.get('billing') as 'monthly' | 'annual';
    const success = searchParams.get('success');

    // Fix #1: simple one-time refetch after delay instead of fragile polling
    if (success === 'true') {
      toast.success('Subscription updated successfully');
      router.replace('/dashboard/settings?tab=billing');
      setTimeout(() => fetchUserPlan(), 5000);
      return;
    }

    if (checkoutPlan && user?.email) {
      setActiveTab('billing');
      try {
        startTransition(async () => {
          if (!clerkUser?.id) return;
          
          if (!window.Paddle) {
            toast.error("Payment system not loaded. Please refresh the page.");
            return;
          }

          const priceId = getPaddlePriceId(checkoutPlan as 'starter' | 'pro', checkoutBilling || 'monthly');
          
          window.Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            settings: {
              displayMode: "overlay",
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&success=true`,
            },
            customData: { userId: clerkUser.id },
            customer: { email: user.email },
          });
        });
        router.replace('/dashboard/settings?tab=billing');
      } catch (err) {
        console.error("Failed to auto-open checkout", err);
      }
    }
  }, [searchParams, user?.email, router]);

  const fetchUserPlan = async () => {
    try {
      if (!clerkUser) return;

      const token = await window.Clerk?.session?.getToken();

      const response = await fetch("/api/user/plan", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? {
          ...prev,
          planTier: data.plan || data.planTier || "free",
          planStatus: "active",
          articleCountThisPeriod: data.usage?.articlesUsed || data.articleCountThisPeriod || 0,
          paddleCustomerId: data.paddleCustomerId,
          paddleSubscriptionId: data.paddleSubscriptionId,
          status: data.status,
          currentPeriodEnd: data.currentPeriodEnd,
        } : null);
      }
    } catch (error) {
      console.error("Failed to fetch user plan:", error);
    }
  };

  const fetchWordPressSites = async () => {
    setLoadingSites(true);
    try {
      if (!clerkUser) {
        return;
      }

      const token = await window.Clerk?.session?.getToken();

      const response = await fetch("/api/wordpress/sites", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWordPressSites(data.sites || []);
      }
    } catch (error) {
      console.error("Failed to fetch WordPress sites:", error);
    } finally {
      setLoadingSites(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 lg:h-9 w-40 lg:w-48" />
          <Skeleton className="h-4 w-48 lg:w-64" />
        </div>
        <Skeleton className="h-24 lg:h-32 w-full rounded-xl lg:rounded-2xl" />
        <Skeleton className="h-40 lg:h-48 w-full rounded-xl lg:rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 lg:h-64 w-full rounded-xl lg:rounded-2xl" />
          <Skeleton className="h-56 lg:h-64 w-full rounded-xl lg:rounded-2xl" />
        </div>
      </div>
    );
  }

  const renderStat = (val: any) => {
    if (typeof val === "object" && val !== null && "value" in val) return val.value;
    return val;
  };

  const currentTier = (user?.planTier === 'free' || user?.planTier === 'starter' || user?.planTier === 'pro') ? user.planTier : 'free';
  const planLimits = PLANS[currentTier]?.limits;
  const articleLimit = planLimits?.articlesPerMonth ?? 5;
  const articlesUsed = user?.articleCountThisPeriod ?? 0;
  const usagePct = Math.min(100, (articlesUsed / articleLimit) * 100);

  // Calculate days until reset (1st of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handleManageSubscription = async () => {
    if (!user?.paddleCustomerId) {
      toast.error("Subscription not ready yet. Please refresh the page.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createPaddleCustomerPortalSession(user.paddleCustomerId!, user.paddleSubscriptionId);
        if (result.success && result.url) {
          window.location.href = result.url;
        } else {
          toast.error(result.error || "Failed to open customer portal");
        }
      } catch (error) {
        toast.error("Failed to open customer portal");
        console.error(error);
      }
    });
  };



  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5 blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Account <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Settings</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Manage your account and subscription.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 border-b border-border">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'billing', label: 'Billing & Usage', shortLabel: 'Billing', icon: BarChart3 },
            { id: 'integrations', label: 'Integrations', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap relative",
                  activeTab === tab.id
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{'shortLabel' in tab ? tab.shortLabel : tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 lg:space-y-8 relative z-10"
        >
        {/* Account Tab */}
        {activeTab === 'account' && (
          <>
            {/* Account info */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base lg:text-lg font-semibold text-foreground">Account Information</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-mono-dm text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Email
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  </div>
                </div>
                {user?.displayName && (
                  <div>
                    <p className="font-mono-dm text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Name
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-mono-dm text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm font-semibold text-foreground">Active</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-mono-dm text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Member Since</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                    <p className="font-mono-dm text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary text-[10px] inline-flex">
                      {currentTier === "pro" && <Crown className="h-3 w-3 mr-1" />}
                      {currentTier}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Section managed by Clerk */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac/15 text-lilac">
                  <Lock className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base lg:text-lg font-semibold text-foreground">Account Security & Data</h2>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Manage Authentication</p>
                  <p className="font-mono-dm text-xs text-muted-foreground mt-0.5">Change password, enable MFA, or delete your account securely via Clerk.</p>
                </div>
                <button
                  onClick={() => window.Clerk?.openUserProfile()}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all whitespace-nowrap shadow-md shadow-primary/20"
                >
                  Manage Privacy
                </button>
              </div>
            </section>
          </>
        )}


        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <>
            {/* Payment Management */}
            {currentTier !== 'free' && (
              <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-8">
                <div className="mb-4 lg:mb-6 flex items-start gap-3">
                  <div className="flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl lg:rounded-2xl bg-primary/15 text-primary shadow-inner">
                    <Crown className="h-5 w-5 lg:h-6 lg:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base lg:text-lg font-bold text-foreground">Subscription</h2>
                      {user?.paddleCustomerId && (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          user.status === 'active' ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" :
                          user.status === 'cancelled' ? "bg-muted text-muted-foreground border-border" :
                          user.status === 'on_hold' ? "bg-destructive/10 text-destructive border-destructive/30" :
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {user.status === 'active' ? 'ACTIVE' :
                           user.status === 'cancelled' ? 'CANCELLED' :
                           user.status === 'on_hold' ? 'PAYMENT FAILED' :
                           (user.status ?? 'PROCESSING')?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                      {!user?.paddleCustomerId && 'Processing — this usually takes 10–30 seconds'}
                      {user?.paddleCustomerId && user.status === 'active' && user.currentPeriodEnd && (() => {
                        const renewDate = new Date(user.currentPeriodEnd);
                        const isStale = renewDate < new Date();
                        return isStale
                          ? 'Renewal date pending sync...'
                          : `Renews ${renewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      })()}
                      {user?.paddleCustomerId && user.status === 'cancelled' && user.currentPeriodEnd &&
                        `Access until ${new Date(user.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      {user?.paddleCustomerId && user.status === 'on_hold' && 'Update your payment method to restore access'}
                    </p>
                  </div>
                </div>

                {user?.paddleCustomerId ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-xs lg:text-sm px-3 py-2 lg:px-4 w-full disabled:opacity-50 mb-6"
                  >
                    {isPending ? 'Loading...' : 'Manage Subscription'}
                  </button>
                ) : (
                  <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                      <p className="text-sm font-medium text-foreground">Processing your subscription...</p>
                    </div>
                    <p className="text-xs text-muted-foreground">This usually takes 10–30 seconds.</p>
                  </div>
                )}

                {user?.paddleCustomerId && (
                  <BillingManagement
                    customerId={user.paddleCustomerId}
                    subscriptionId={user.paddleSubscriptionId}
                    currentPlan={currentTier}
                    currentPeriodEnd={user.currentPeriodEnd}
                    onCancelSuccess={fetchUserPlan}
                  />
                )}
              </section>
            )}

            {/* Usage meter */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-5 lg:p-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500 shadow-inner">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg lg:text-xl font-bold text-foreground">Usage this period</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500/60"></span>
                      </span>
                      <p className="font-mono-dm text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary py-1.5 px-3",
                      currentTier === "pro" ? "bg-primary/15 text-primary border-gold/40" : "bg-cyan-500/15 text-cyan-500 border-cyan-500/40"
                    )}
                  >
                    {currentTier === "pro" && <Crown className="h-3.5 w-3.5 mr-1.5" />}
                    <span className="font-bold text-xs">{currentTier.toUpperCase()} PLAN</span>
                  </span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Articles generated</span>
                  <span className="text-lg font-bold text-foreground font-display">
                    {renderStat(articlesUsed)} <span className="text-muted-foreground text-sm font-medium">/ {articleLimit}</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/50 border border-border/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 shadow-sm",
                      usagePct > 80 ? "bg-destructive" : "bg-gradient-to-r from-teal via-gold to-gold/80"
                    )}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-mono-dm text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                    {articleLimit - articlesUsed} articles remaining
                  </p>
                  {usagePct > 70 && (
                    <span className="text-[10px] text-gold font-bold flex items-center gap-1 animate-pulse">
                      <TrendingUp size={12} /> Running low
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* SERP Pro callout */}
            {currentTier !== "pro" && (
              <section className="card-premium rounded-xl lg:rounded-2xl border border-gold/30 bg-gold/5 p-5 lg:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full blur-3xl bg-gold/10 group-hover:bg-gold/20 transition-all" />
                <div className="flex flex-col sm:flex-row items-start gap-5 relative z-10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-[#0a0700] shadow-gold transform group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                      Why Pro users rank faster
                      <Crown className="h-4 w-4 text-gold mb-1" />
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Pro briefs are enriched with <strong className="text-foreground">live SERP data</strong> — the AI reads the top 10 ranking pages, real Google PAA questions, and related searches before writing your content.
                      It's like having an SEO expert research every article for you.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                            {['G', 'B', 'Y'][i]}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Used by 500+ SEO Experts</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Pricing tier cards */}
            <section>
              <div className="mb-6">
                <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground">Choose Your Plan</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upgrade to unlock higher SEO scores, more articles, and unlimited AI optimizations.
                </p>
              </div>

              <PricingCards
                currentPlan={currentTier as 'free' | 'starter' | 'pro'}
                onSuccess={() => {
                  fetchUserPlan();
                  router.refresh();
                }}
              />
            </section>
          </>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <>
            {/* WordPress Integration */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac/15 text-lilac">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base lg:text-lg font-semibold text-foreground">WordPress Publishing</h2>
                    <p className="font-mono-dm text-xs text-muted-foreground">
                      Connect your WordPress sites for one-click publishing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWordPressDialog(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-xs px-3 py-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Connect Site</span>
                  <span className="sm:hidden">Add Site</span>
                </button>
              </div>

              {loadingSites ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-20 lg:h-24 rounded-lg shimmer bg-muted" />
                  ))}
                </div>
              ) : (
                <WordPressSitesList
                  sites={wordPressSites}
                  onSitesChange={fetchWordPressSites}
                />
              )}
            </section>

            {/* Coming Soon Integrations */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base lg:text-lg font-semibold text-foreground">More Integrations Coming Soon</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg border border-border bg-muted/30 opacity-60">
                  <p className="text-sm font-medium text-foreground mb-1">Webflow</p>
                  <p className="font-mono-dm text-xs text-muted-foreground">Coming soon</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30 opacity-60">
                  <p className="text-sm font-medium text-foreground mb-1">Shopify</p>
                  <p className="font-mono-dm text-xs text-muted-foreground">Coming soon</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30 opacity-60">
                  <p className="text-sm font-medium text-foreground mb-1">Ghost</p>
                  <p className="font-mono-dm text-xs text-muted-foreground">Coming soon</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30 opacity-60">
                  <p className="text-sm font-medium text-foreground mb-1">Medium</p>
                  <p className="font-mono-dm text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </section>
          </>
        )}
        </motion.div>
      </AnimatePresence>

      {/* WordPress Connection Dialog */}
      <WordPressConnectionDialog
        open={showWordPressDialog}
        onOpenChange={setShowWordPressDialog}
        onSuccess={fetchWordPressSites}
      />

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto min-h-screen">
        <Skeleton className="h-8 lg:h-9 w-40 lg:w-48" />
        <Skeleton className="h-24 lg:h-32 w-full rounded-xl lg:rounded-2xl" />
      </div>
    }>
        <SettingsContent />
    </Suspense>
  );
}
