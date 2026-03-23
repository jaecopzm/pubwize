"use client";

import * as React from "react";
import {
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Zap,
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
  Crown,
  BarChart3,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { useUsage } from "@/lib/hooks/use-usage";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

/* ─────────────────────────────────────────────────────────────────────────
   Nav config
───────────────────────────────────────────────────────────────────────── */
const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Articles", url: "/dashboard/articles", icon: FileText },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarIcon },
  { title: "Research", url: "/dashboard/research", icon: Search },
  { title: "Sites", url: "/dashboard/sites", icon: Globe },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const proNavItems = [
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, badge: "PRO" },
];

/* ─────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────── */
function UserAvatar({ email }: { email?: string }) {
  const initials = email ? email.split("@")[0].slice(0, 2).toUpperCase() : "PW";
  return <div className="sb-avatar">{initials}</div>;
}

/* ─────────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────────────── */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userEmail?: string;
  onSignOut?: () => void;
}

export function AppSidebar({ userEmail, onSignOut, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, usage, isLoading } = useUserPlan();
  const { data: detailedUsage } = useUsage();
  const { setOpenMobile, isMobile, setOpen } = useSidebar();

  // Auto-close sidebar on mobile when navigating
  const handleNavigation = React.useCallback((url: string) => {
    router.push(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [router, isMobile, setOpenMobile]);

  // Determine if user should see upgrade nudge
  const showUpgrade = plan === 'free' || plan === 'starter';
  const planDisplay = plan === 'free' ? 'Free Plan' : plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Enterprise';
  
  // Use detailed usage data for accurate counts
  const articlesUsed = detailedUsage?.usage?.articlesUsed || usage.articlesGenerated || 0;
  const articlesLimit = detailedUsage?.limits?.articlesPerMonth || usage.limit || 5;
  const rollover = detailedUsage?.usage?.rolloverArticles || 0;
  const totalLimit = articlesLimit + rollover;
  const usagePercent = totalLimit > 0 ? Math.round((articlesUsed / totalLimit) * 100) : 0;

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border">

      {/* ── Brand Header ── */}
      <SidebarHeader style={{ padding: "12px 0", minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
          <img src="/pubwize-icon.png" alt="Pubwize" className="h-9 w-9 flex-shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden" style={{ fontFamily: "var(--font-syne)", fontSize: "20px", fontWeight: 800, color: "var(--sidebar-foreground)", letterSpacing: "-0.02em" }}>
            Pubwize
          </span>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent style={{ paddingTop: 6, gap: 0, overflowY: 'auto', flex: 1 }}>
        <SidebarGroup className="py-0">
          {/* Section label */}
          <div className="sb-group-label group-data-[collapsible=icon]:hidden">
            Navigation
          </div>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      onClick={() => handleNavigation(item.url)}
                      asChild
                    >
                      <div className={`sb-nav-item${isActive ? " active" : ""} group-data-[collapsible=icon]:justify-center`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <ChevronRight size={11} className="sb-item-arrow group-data-[collapsible=icon]:hidden" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pro Features Section */}
        {plan === 'pro' && (
          <SidebarGroup className="py-0">
            <div className="sb-group-label group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              transition: 'opacity 0.2s, height 0.2s'
            }}>
              <Crown size={12} className="text-gold" />
              <span>Pro Features</span>
            </div>

            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {proNavItems.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        onClick={() => handleNavigation(item.url)}
                        asChild
                      >
                        <div className={`sb-nav-item${isActive ? " active" : ""} group-data-[collapsible=icon]:justify-center`}>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden flex items-center gap-2">
                            {item.title}
                            {item.badge && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                                {item.badge}
                              </span>
                            )}
                          </span>
                          {isActive && (
                            <ChevronRight size={11} className="sb-item-arrow group-data-[collapsible=icon]:hidden" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter style={{ padding: "4px 0 6px", flexShrink: 0 }}>

        {/* Plan & Usage Info */}
        {!isLoading && (
          <div className="sb-upgrade group-data-[collapsible=icon]:hidden" style={{ 
            background: showUpgrade 
              ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0, 128, 128, 0.15) 100%)',
            border: showUpgrade ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(0, 128, 128, 0.3)',
            padding: '8px 10px'
          }}>
            <div className="sb-upgrade-title" style={{ marginBottom: 4, fontSize: '12px' }}>
              {showUpgrade ? <Zap size={12} /> : <Crown size={12} />}
              {planDisplay}
            </div>
            
            {/* Usage bar */}
            <div style={{ marginBottom: showUpgrade ? 6 : 0 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 3,
                fontSize: '10px',
                color: 'var(--text-2)'
              }}>
                <span>Articles</span>
                <span style={{ fontWeight: 600 }}>
                  {articlesUsed}/{totalLimit}
                </span>
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(usagePercent, 100)}%`,
                  background: usagePercent >= 100 
                    ? '#ef4444'
                    : usagePercent >= 80
                    ? '#f59e0b'
                    : '#10b981',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {showUpgrade && (
              <button 
                className="sb-upgrade-btn"
                style={{ marginTop: 6, padding: '6px 10px', fontSize: '11px' }}
                onClick={() => {
                  handleNavigation('/dashboard/settings?tab=billing');
                }}
              >
                Upgrade →
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="sb-upgrade group-data-[collapsible=icon]:hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            padding: '8px 10px'
          }}>
            <div className="sb-upgrade-title" style={{ fontSize: '12px' }}>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              Loading...
            </div>
          </div>
        )}

        <div className="sb-sep group-data-[collapsible=icon]:hidden" />

        {/* User row */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={userEmail ?? "Account"}
              asChild
            >
              <div className="sb-user-row group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!flex">
                <UserAvatar email={userEmail} />
                <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
                  <div className="sb-user-name">
                    {userEmail?.split("@")[0] ?? "My Account"}
                  </div>
                  <div className="sb-user-email">{userEmail}</div>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton tooltip="Sign out" asChild>
              <button className="sb-signout" onClick={onSignOut}>
                <LogOut />
                <span>Sign out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}