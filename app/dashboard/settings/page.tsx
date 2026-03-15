"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
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
import { getDodoPriceId } from "@/lib/dodo";
import { createDodoCheckoutSession, createDodoCustomerPortalSession } from "@/app/actions/dodo";
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
  dodoCustomerId?: string;
  dodoSubscriptionId?: string;
  status?: string;
  currentPeriodEnd?: string;
}

type SettingsTab = 'account' | 'brand_voice' | 'billing' | 'integrations';

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [showWordPressDialog, setShowWordPressDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEmailProvider, setIsEmailProvider] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        email: currentUser.email || "",
        displayName: currentUser.displayName || undefined,
        createdAt: currentUser.metadata.creationTime,
      });
      setIsEmailProvider(currentUser.providerData.some(p => p.providerId === "password"));
      fetchUserPlan();
      fetchWordPressSites();
    }
    setLoading(false);
  }, []);

  // Handle auto-checkout from signup redirect
  useEffect(() => {
    const checkoutPlan = searchParams.get('checkout');
    const checkoutBilling = searchParams.get('billing') as 'monthly' | 'annual';
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    // Show success message after returning from portal/checkout
    if (success === 'true') {
      toast.success('Subscription updated successfully');
      
      // Poll for subscription data (webhook might take a few seconds)
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        await fetchUserPlan();
        
        // Stop polling after 10 attempts (30 seconds) or when customerId is set
        if (attempts >= 10 || user?.dodoCustomerId) {
          clearInterval(pollInterval);
        }
      }, 3000);
      
      router.replace('/dashboard/settings?tab=billing');
      return;
    }

    if (checkoutPlan && user?.email) {
      setActiveTab('billing');
      // Only auto-checkout once if needed (we'd need a ref to prevent double firing in strict mode)
      try {
        startTransition(async () => {
          const priceId = getDodoPriceId(checkoutPlan as 'starter' | 'pro', checkoutBilling || 'monthly');
          const result = await createDodoCheckoutSession({ priceId, customerEmail: user.email, userId: user.email }); // Note user.email used for now if uid isn't there
          if (result.success && result.url) {
            window.location.href = result.url;
          } else {
            toast.error(result.error || "Checkout failed to initialize.");
          }
        });
        // Clean URL so it doesn't pop up again on refresh
        router.replace('/dashboard/settings');
      } catch (err) {
        console.error("Failed to auto-open checkout", err);
      }
    }
  }, [searchParams, user?.email, router]);

  const fetchUserPlan = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();

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
          dodoCustomerId: data.dodoCustomerId,
          dodoSubscriptionId: data.dodoSubscriptionId,
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
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const token = await user.getIdToken();

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
    if (!user?.dodoCustomerId) {
      toast.error("Subscription not ready yet. Please refresh the page.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDodoCustomerPortalSession(user.dodoCustomerId!);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        await auth.signOut();
        router.push("/");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        toast.success("Password changed successfully");
        setShowPasswordDialog(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto aurora-bg noise-overlay min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-10 relative z-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Account <span className="gradient-gold-teal">Settings</span>
        </h1>
        <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">
          Manage your account and subscription.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 lg:mb-8 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 border-b border-border">
          <button
            onClick={() => setActiveTab('account')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
              activeTab === 'account'
                ? "bg-card text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
              activeTab === 'billing'
                ? "bg-card text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Billing & Usage</span>
            <span className="sm:hidden">Billing</span>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
              activeTab === 'integrations'
                ? "bg-card text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8 relative z-10">
        {/* Account Tab */}
        {activeTab === 'account' && (
          <>
            {/* Account info */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
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
                      <CheckCircle2 className="h-4 w-4 text-teal" />
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
                    <span className="badge-gold text-[10px] inline-flex">
                      {currentTier === "pro" && <Crown className="h-3 w-3 mr-1" />}
                      {currentTier}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
              <div className="mb-4 lg:mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac/15 text-lilac">
                  <Lock className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base lg:text-lg font-semibold text-foreground">Security</h2>
              </div>
              <div className="space-y-4">
                {isEmailProvider && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="font-mono-dm text-xs text-muted-foreground mt-0.5">Change your account password</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordDialog(true)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:border-primary/30 transition-all whitespace-nowrap"
                    >
                      Change
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 opacity-60">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="font-mono-dm text-xs text-muted-foreground mt-0.5">Coming soon</p>
                  </div>
                  <button disabled className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-muted-foreground cursor-not-allowed whitespace-nowrap">
                    Enable
                  </button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-destructive/30 bg-card p-4 lg:p-6">
              <h2 className="font-display mb-4 text-base font-semibold text-destructive">Danger Zone</h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="font-mono-dm text-xs text-muted-foreground">Permanently delete your account and all data. Irreversible.</p>
                </div>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive bg-transparent hover:bg-destructive/10 transition-colors whitespace-nowrap"
                >
                  Delete Account
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
                <div className="mb-4 lg:mb-6 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl lg:rounded-2xl bg-gold/15 text-gold shadow-inner">
                      <Crown className="h-5 w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-base lg:text-lg font-bold text-foreground">Subscription</h2>
                      <p className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">
                        {!user?.dodoCustomerId && 'Processing subscription...'}
                        {user?.dodoCustomerId && user.status === 'active' && 'Active subscription'}
                        {user?.dodoCustomerId && user.status === 'on_hold' && 'Update payment method'}
                        {user?.dodoCustomerId && user.status === 'cancelled' && 'Ends ' + (user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')}
                      </p>
                    </div>
                  </div>
                  {user?.dodoCustomerId ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isPending}
                      className="btn-gold text-xs lg:text-sm px-3 py-2 lg:px-4 w-full disabled:opacity-50"
                    >
                      {isPending ? 'Loading...' : 'Manage Subscription'}
                    </button>
                  ) : (
                    <div className="p-4 rounded-lg bg-teal/5 border border-teal/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                        <p className="text-sm font-medium text-foreground">Processing your subscription...</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This usually takes 10-30 seconds. The page will update automatically.
                      </p>
                    </div>
                  )}
                </div>
                {user?.dodoCustomerId && (
                  <BillingManagement
                    customerId={user.dodoCustomerId}
                    subscriptionId={user.dodoSubscriptionId}
                    currentPlan={currentTier}
                    onCancelSuccess={fetchUserPlan}
                  />
                )}
              </section>
            )}

            {/* Usage meter */}
            <section className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-5 lg:p-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/15 text-teal shadow-inner">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg lg:text-xl font-bold text-foreground">Usage this period</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal/60"></span>
                      </span>
                      <p className="font-mono-dm text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      "badge-gold py-1.5 px-3",
                      currentTier === "pro" ? "bg-gold/15 text-gold border-gold/40" : "bg-teal/15 text-teal border-teal/40"
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
                  className="btn-gold text-xs px-3 py-2 w-full sm:w-auto"
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
      </div>

      {/* WordPress Connection Dialog */}
      <WordPressConnectionDialog
        open={showWordPressDialog}
        onOpenChange={setShowWordPressDialog}
        onSuccess={fetchWordPressSites}
      />

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">This action cannot be undone. This will permanently delete:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your account and profile</li>
                <li>All articles and drafts</li>
                <li>All site configurations</li>
                <li>All WordPress connections</li>
                <li>Your subscription (if active)</li>
              </ul>
              <span className="block font-semibold text-foreground pt-2">Are you absolutely sure?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new password below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new password"
                disabled={isChangingPassword}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm new password"
                disabled={isChangingPassword}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
