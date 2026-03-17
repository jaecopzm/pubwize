"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { 
  Zap, 
  Search, 
  Filter, 
  BarChart3, 
  Activity,
  Brain,
  Clock,
  User,
  Cpu
} from "lucide-react";

interface AIUsageData {
  logs: Array<{ id: string; userId: string; provider: string; model: string; taskType: string; ts: string | null }>;
  byProvider: Record<string, number>;
  byTask: Record<string, number>;
  total: number;
}

export default function AdminAIUsagePage() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [uidFilter, setUidFilter] = useState("");
  const [applied, setApplied] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(uid?: string) {
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    const url = `/api/admin/ai-usage${uid ? `?uid=${uid}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-teal/20 flex items-center justify-center flex-shrink-0">
          <Brain className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-bold">AI Usage Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {data?.total || 0} total API calls tracked
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="search-glow-wrapper flex-1 max-w-md">
          <div className="search-glow" />
          <div className="relative z-10">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by user ID..."
              value={uidFilter}
              onChange={(e) => setUidFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/30 transition-all"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => { setApplied(uidFilter); load(uidFilter || undefined); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:border-gold/30 hover:bg-gold/5 transition-all"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
          {applied && (
            <button 
              onClick={() => { setUidFilter(""); setApplied(""); load(); }} 
              className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-gold transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading AI usage data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Provider */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-gold to-teal rounded-full" />
                <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  By Provider (Last 100)
                </h2>
              </div>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {Object.entries(data.byProvider).length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Cpu className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No provider data</p>
                  </div>
                ) : (
                  Object.entries(data.byProvider).map(([provider, count], index) => (
                    <div key={provider} className={`flex items-center justify-between px-6 py-4 ${
                      index !== Object.entries(data.byProvider).length - 1 ? 'border-b border-border' : ''
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-gold" />
                        </div>
                        <span className="font-semibold capitalize">{provider}</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* By Task */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-teal to-lilac rounded-full" />
                <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  By Task Type (Last 100)
                </h2>
              </div>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {Object.entries(data.byTask).length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No task data</p>
                  </div>
                ) : (
                  Object.entries(data.byTask).map(([task, count], index) => (
                    <div key={task} className={`flex items-center justify-between px-6 py-4 ${
                      index !== Object.entries(data.byTask).length - 1 ? 'border-b border-border' : ''
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-teal/10 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-teal" />
                        </div>
                        <span className="font-semibold capitalize">{task}</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Recent Calls Table */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-lilac to-gold rounded-full" />
              <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Recent API Calls ({data.total})
              </h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-border bg-muted/30 text-xs font-mono-dm font-bold uppercase tracking-widest text-muted-foreground">
                <span>User ID</span>
                <span>Provider</span>
                <span>Model</span>
                <span>Task</span>
                <span>Time</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {data.logs.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No API calls logged yet</p>
                  </div>
                ) : (
                  data.logs.map((log) => (
                    <div key={log.id} className="grid grid-cols-5 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="font-mono text-xs text-muted-foreground truncate">
                        {log.userId}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-gold/10 flex items-center justify-center">
                          <Zap className="h-3 w-3 text-gold" />
                        </div>
                        <span className="text-sm font-semibold capitalize">{log.provider}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {log.model}
                      </div>
                      <div className="text-sm font-semibold capitalize">
                        {log.taskType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.ts ? new Date(log.ts).toLocaleString() : "—"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 max-h-96 overflow-y-auto">
              {data.logs.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No API calls logged yet</p>
                </div>
              ) : (
                data.logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize">{log.provider}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{log.model}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Task</p>
                        <p className="font-semibold capitalize">{log.taskType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Time</p>
                        <p className="font-semibold">
                          {log.ts ? new Date(log.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">User ID</p>
                        <p className="font-mono text-xs text-muted-foreground truncate">{log.userId}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
