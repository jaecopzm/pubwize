"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Shield, Users, Zap, Mail, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { title: "Overview", url: "/admin", icon: BarChart3 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "AI Usage", url: "/admin/ai-usage", icon: Zap },
  { title: "Email", url: "/admin/email", icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.replace("/auth/signin");
        return;
      }
      const token = await user.getIdTokenResult();
      if (!token.claims.admin) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen aurora-bg noise-overlay flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-gold animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg noise-overlay">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-gold" />
                </div>
                <span className="font-display font-bold text-base sm:text-lg truncate">Pubwize Admin</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                        isActive
                          ? "bg-gold/10 text-gold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-muted-foreground hover:text-gold transition-colors hidden sm:inline"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="sm:hidden text-xs font-semibold text-muted-foreground hover:text-gold transition-colors"
              >
                Dashboard
              </Link>
              <div className="badge-gold text-[9px] sm:text-xs px-2 sm:px-3">
                Admin
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-1 mt-3 sm:mt-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
