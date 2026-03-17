"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Globe, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  Activity,
  Crown,
  Zap,
  AlertCircle
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalArticles: number;
  totalSites: number;
  planBreakdown: Record<string, number>;
  recentSignups: number;
  recentArticles: number;
}

interface Revenue {
  mrr: number;
  paidUsers: number;
  freeUsers: number;
  totalUsers: number;
  conversionRate: string;
  churnedThisMonth: number;
}

interface ActivityEvent {
  type: "signup" | "article";
  id: string;
  label: string;
  userId?: string;
  ts: { seconds: number } | null;
}

async function authedFetch(path: string) {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed: ${path}`);
  return res.json();
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authedFetch("/api/admin/stats").then(setStats),
      authedFetch("/api/admin/revenue").then(setRevenue),
      authedFetch("/api/admin/activity").then((d) => setActivity(d.events)),
    ])
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-teal/20 flex items-center justify-center flex-shrink-0">
          <Activity className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold truncate">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Real-time metrics and system health</p>
        </div>
      </div>

      {/* Platform Stats */}
      {stats && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-gold to-teal rounded-full" />
            <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Metrics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { 
                label: "Total Users", 
                value: stats.totalUsers, 
                icon: Users, 
                color: "text-teal",
                bgColor: "bg-teal/10"
              },
              { 
                label: "Total Articles", 
                value: stats.totalArticles, 
                icon: FileText, 
                color: "text-gold",
                bgColor: "bg-gold/10"
              },
              { 
                label: "Total Sites", 
                value: stats.totalSites, 
                icon: Globe, 
                color: "text-lilac",
                bgColor: "bg-lilac/10"
              },
              { 
                label: "New Users (7d)", 
                value: stats.recentSignups, 
                icon: UserPlus, 
                color: "text-teal",
                bgColor: "bg-teal/10"
              },
              { 
                label: "New Articles (7d)", 
                value: stats.recentArticles, 
                icon: TrendingUp, 
                color: "text-gold",
                bgColor: "bg-gold/10"
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 card-premium">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-mono-dm text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Revenue Metrics */}
      {revenue && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-teal to-lilac rounded-full" />
            <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenue Metrics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { 
                label: "MRR", 
                value: `$${revenue.mrr.toLocaleString()}`, 
                icon: DollarSign, 
                color: "text-gold",
                bgColor: "bg-gold/10"
              },
              { 
                label: "Paid Users", 
                value: revenue.paidUsers, 
                icon: Crown, 
                color: "text-gold",
                bgColor: "bg-gold/10"
              },
              { 
                label: "Free Users", 
                value: revenue.freeUsers, 
                icon: Users, 
                color: "text-muted-foreground",
                bgColor: "bg-muted/50"
              },
              { 
                label: "Conversion Rate", 
                value: `${revenue.conversionRate}%`, 
                icon: TrendingUp, 
                color: "text-teal",
                bgColor: "bg-teal/10"
              },
              { 
                label: "Churned (30d)", 
                value: revenue.churnedThisMonth, 
                icon: AlertCircle, 
                color: "text-red-500",
                bgColor: "bg-red-500/10"
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 card-premium">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <p className="font-mono-dm text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Grid: Plan Breakdown + Activity Feed */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Plan Breakdown */}
        {stats && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-lilac to-gold rounded-full" />
              <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">Plan Distribution</h2>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {Object.entries(stats.planBreakdown).map(([plan, count], index) => (
                <div key={plan} className={`flex items-center justify-between px-6 py-4 ${
                  index !== Object.entries(stats.planBreakdown).length - 1 ? 'border-b border-border' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      plan === 'pro' ? 'bg-gold/10' : plan === 'starter' ? 'bg-teal/10' : 'bg-muted/50'
                    }`}>
                      {plan === 'pro' ? (
                        <Crown className="h-4 w-4 text-gold" />
                      ) : plan === 'starter' ? (
                        <Zap className="h-4 w-4 text-teal" />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-semibold capitalize">{plan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">{count}</span>
                    <p className="text-xs text-muted-foreground">
                      {((count / stats.totalUsers) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Feed */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-gold to-teal rounded-full" />
            <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {activity.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                </div>
              ) : (
                activity.map((event, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-4 ${
                    i !== activity.length - 1 ? 'border-b border-border' : ''
                  }`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      event.type === "signup" 
                        ? "bg-teal/10" 
                        : "bg-gold/10"
                    }`}>
                      {event.type === "signup" ? (
                        <UserPlus className="h-4 w-4 text-teal" />
                      ) : (
                        <FileText className="h-4 w-4 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.type === "signup" ? "New user signup" : "Article created"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {event.ts?.seconds ? new Date(event.ts.seconds * 1000).toLocaleDateString() : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
