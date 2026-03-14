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
  const { setOpenMobile, isMobile } = useSidebar();

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
  const usagePercent = usage.limit > 0 ? Math.round((usage.articlesGenerated / usage.limit) * 100) : 0;

  return (
    <Sidebar collapsible="icon" {...props}>

      {/* ── Brand Header ── */}
      <SidebarHeader style={{ borderBottom: "1px solid rgba(255,255,255,0.055)", padding: "14px 10px 12px" }}>
        {/* When collapsed: center logo only */}
        <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center hidden">
          <img src="/pubwize-logo.png" alt="Pubwize" className="h-8 w-auto flex-shrink-0" />
        </div>

        {/* When expanded: logo + text layout */}
        <div className="group-data-[collapsible=icon]:hidden flex items-center justify-center gap-2">
          <img src="/PubWize.png" alt="Pubwize" className="h-9 w-auto flex-shrink-0" />
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent style={{ paddingTop: 10, gap: 0, overflowY: 'auto', flex: 1 }}>
        <SidebarGroup>
          {/* Section label */}
          <div className="sb-group-label group-data-[collapsible=icon]:hidden">
            Navigation
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
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
                      <div className={`sb-nav-item${isActive ? " active" : ""}`}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        <ChevronRight size={11} className="sb-item-arrow group-data-[collapsible=icon]:hidden" />
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
          <SidebarGroup>
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
              <SidebarMenu>
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
                        <div className={`sb-nav-item${isActive ? " active" : ""}`}>
                          <item.icon />
                          <span className="group-data-[collapsible=icon]:hidden flex items-center gap-2">
                            {item.title}
                            {item.badge && (
                              <span className="badge-gold text-[8px] px-1.5 py-0.5">
                                {item.badge}
                              </span>
                            )}
                          </span>
                          <ChevronRight size={11} className="sb-item-arrow group-data-[collapsible=icon]:hidden" />
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
      <SidebarFooter style={{ padding: "6px 0 8px", flexShrink: 0 }}>

        {/* Plan & Usage Info */}
        {!isLoading && (
          <div className="sb-upgrade group-data-[collapsible=icon]:hidden" style={{ 
            background: showUpgrade 
              ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(0, 128, 128, 0.15) 100%)',
            border: showUpgrade ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(0, 128, 128, 0.3)'
          }}>
            <div className="sb-upgrade-title" style={{ marginBottom: 6 }}>
              {showUpgrade ? <Zap size={14} /> : <Crown size={14} />}
              {planDisplay}
            </div>
            
            {/* Usage bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 4,
                fontSize: '11px',
                color: 'var(--text-2)'
              }}>
                <span>Articles</span>
                <span style={{ fontWeight: 600 }}>
                  {usage.articlesGenerated} / {usage.limit}
                </span>
              </div>
              <div style={{
                height: 6,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(usagePercent, 100)}%`,
                  background: usagePercent >= 100 
                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                    : usagePercent >= 80
                    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(90deg, var(--gold) 0%, var(--teal) 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: 3,
                  animation: usagePercent >= 90 ? 'pulse 2s infinite' : 'none'
                }} />
              </div>
            </div>

            {/* Pro: Show additional metrics */}
            {plan === 'pro' && detailedUsage && (
              <div style={{ 
                marginBottom: 8,
                padding: '6px 8px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: 6,
                fontSize: '10px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', marginBottom: 2, fontSize: '9px' }}>AI Improve</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '11px' }}>
                      {detailedUsage.usage.aiImprovementsUsed}/∞
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', marginBottom: 2, fontSize: '9px' }}>Regen</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '11px' }}>
                      {detailedUsage.usage.sectionRegenerationsUsed}/∞
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', marginBottom: 2, fontSize: '9px' }}>Social</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '11px' }}>
                      {detailedUsage.usage.articlesUsed}/∞
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', marginBottom: 2, fontSize: '9px' }}>Research</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '11px' }}>
                      ∞
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showUpgrade ? (
              <>
                <p className="sb-upgrade-sub">Unlock unlimited articles &amp; priority generation</p>
                <button 
                  className="sb-upgrade-btn"
                  onClick={() => {
                    handleNavigation('/dashboard/settings?tab=billing');
                  }}
                >
                  Upgrade now →
                </button>
              </>
            ) : (
              <p className="sb-upgrade-sub" style={{ marginBottom: 0 }}>
                Thank you for being a {planDisplay} member! 🎉
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="sb-upgrade group-data-[collapsible=icon]:hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}>
            <div className="sb-upgrade-title">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              Loading plan...
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