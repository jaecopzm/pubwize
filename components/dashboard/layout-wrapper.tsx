"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu, X, PanelLeft, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useUsage } from "@/lib/hooks/use-usage";
import Link from "next/link";
import { WelcomeModal } from "@/components/welcome-modal";
import { UsageWarningBanner } from "@/components/usage-warning-banner";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { ExitIntentPopup } from "@/components/exit-intent-popup";



/* ── Route label map ── */
const routeLabel = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const map: Record<string, string> = {
    dashboard: "Overview",
    articles: "Articles",
    calendar: "Calendar",
    research: "Research",
    sites: "Sites",
    settings: "Settings",
    new: "New Article",
  };
  return map[last] ?? last ?? "Dashboard";
};

/* ── Enhanced Sidebar Trigger ── */
function EnhancedSidebarTrigger() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const [showHint, setShowHint] = useState(false);

  // Use the correct open state based on device
  const isOpen = isMobile ? openMobile : open;

  // Show hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem("sidebar-hint-seen");
    if (!hasSeenHint) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem("sidebar-hint-seen", "true");
      }, 3000);
    }
  }, []);

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md p-2 transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "min-h-[44px] min-w-[44px]", // Touch target size
        isOpen && "bg-accent/50"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      {/* Animated icon transition */}
      <div className="relative w-5 h-5">
        {isMobile ? (
          // Mobile: Hamburger menu ↔ X
          <>
            <Menu
              className={cn(
                "absolute inset-0 transition-all duration-200",
                isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
              )}
            />
            <X
              className={cn(
                "absolute inset-0 transition-all duration-200",
                isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
              )}
            />
          </>
        ) : (
          // Desktop: Always PanelLeft icon
          <PanelLeft className="transition-all duration-200" />
        )}
      </div>

      {/* First-time hint */}
      {showHint && (
        <div className="absolute -bottom-10 left-0 z-50 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="rounded-lg bg-gold/90 px-2 py-1 text-[10px] font-medium text-obsidian shadow-lg whitespace-nowrap">
            Tap to open menu
            <div className="absolute -top-1 left-3 h-2 w-2 rotate-45 bg-gold/90" />
          </div>
        </div>
      )}

      {/* Active indicator */}
      {isOpen && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-gold rounded-full" />
      )}
    </button>
  );
}

/* ── Props ── */
interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: usageData } = useUsage();
  const { plan } = useUserPlan();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) router.push("/auth/signin");
      
      // Show welcome modal for new users
      if (u) {
        const hasSeenWelcome = localStorage.getItem("welcome-seen");
        if (!hasSeenWelcome) {
          setTimeout(() => setShowWelcome(true), 500);
        }
      }
    });
    return () => unsub();
  }, [router]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("welcome-seen", "true");
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push("/auth/signin");
  };

  /* ── Premium Loading screen ── */
  if (loading) {
    return (
      <div className="dlw-loading">
        <div className="dlw-loader-wrap">
          {/* Modern spinner */}
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(212, 175, 55, 0.2)',
            borderTop: '3px solid #D4AF37',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 24
          }} />
          
          {/* Premium messaging */}
          <div className="dlw-loading-content">
            <span className="dlw-loading-title">PubWize</span>
            <span className="dlw-loading-subtitle">Loading workspace...</span>
          </div>
          
          {/* Subtle dots animation */}
          <div className="dlw-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar userEmail={user.email ?? undefined} onSignOut={handleSignOut} />

      <SidebarInset className="flex flex-col min-h-screen bg-background w-full overflow-x-hidden">

        {/* Usage warning banner */}
        {usageData && (
          <UsageWarningBanner
            articlesUsed={usageData.usage.articlesUsed}
            articlesLimit={usageData.limits.articlesPerMonth}
            planTier={usageData.plan}
          />
        )}

        {/* ── Top bar ── */}
        <header className="dlw-topbar">
          {/* Enhanced sidebar trigger */}
          <EnhancedSidebarTrigger />

          <div className="dlw-pip" />

          <span className="dlw-route">
            {routeLabel(pathname)}
          </span>

          {/* Usage indicator - hidden on small mobile */}
          {usageData && (
            <Link 
              href="/dashboard/settings?tab=billing"
              className={cn(
                "hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 flex-shrink-0",
                usageData.usage.articlesUsed >= usageData.limits.articlesPerMonth 
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : usageData.usage.articlesUsed / usageData.limits.articlesPerMonth > 0.8
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "bg-teal/10 text-teal border border-teal/20"
              )}
            >
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">{usageData.usage.articlesUsed}/{usageData.limits.articlesPerMonth}</span>
              <span className="sm:hidden">{usageData.usage.articlesUsed}</span>
            </Link>
          )}

          {/* Theme toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>

          {/* Live status */}
          <div className="dlw-status">
            <div className="dlw-status-dot" />
            <span className="hidden sm:inline">Live</span>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="dlw-content">
          {children}
        </div>

      </SidebarInset>

      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <ExitIntentPopup planTier={plan} />
    </SidebarProvider>
  );
}
