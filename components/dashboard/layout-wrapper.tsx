"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
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
import { CommandPalette } from "@/components/command-palette";



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
        "min-h-[44px] min-w-[44px]"
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
          <div className="rounded-lg bg-primary/90 px-2 py-1 text-[10px] font-medium text-primary-foreground shadow-lg whitespace-nowrap">
            Tap to open menu
            <div className="absolute -top-1 left-3 h-2 w-2 rotate-45 bg-primary/90" />
          </div>
        </div>
      )}

      {/* Active indicator */}
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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { data: usageData } = useUsage();
  const { plan } = useUserPlan();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      
      // Show welcome modal for new users
      const hasSeenWelcome = localStorage.getItem("welcome-seen");
      if (!hasSeenWelcome) {
        setTimeout(() => setShowWelcome(true), 500);
      }
    }
  }, [user, isLoaded, router]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("welcome-seen", "true");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  /* ── Simple Loading screen ── */
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-black tracking-tight text-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
              PubWize
            </span>
            <span className="text-sm text-muted-foreground font-medium">Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar userEmail={user.primaryEmailAddress?.emailAddress} onSignOut={handleSignOut} />

      <SidebarInset className="flex flex-col h-screen bg-background w-full overflow-x-hidden overflow-y-hidden">

        {/* ── Top bar ── */}
        <header className="dlw-topbar flex-shrink-0">
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
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
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
        {(() => {
          const isArticleEditor = /^\/dashboard\/articles\/[^/]+$/.test(pathname);
          return (
            <div
              className={cn("dlw-content", isArticleEditor && "dlw-content-flush")}
            >
              {usageData && (
                <UsageWarningBanner
                  articlesUsed={usageData.usage.articlesUsed}
                  articlesLimit={usageData.limits.articlesPerMonth}
                  planTier={usageData.plan}
                />
              )}
              {children}
            </div>
          );
        })()}

      </SidebarInset>

      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <ExitIntentPopup planTier={plan} />
      <CommandPalette />
    </SidebarProvider>
  );
}
