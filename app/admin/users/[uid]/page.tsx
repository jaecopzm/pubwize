"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const PLAN_TIERS = ["none", "free", "starter", "pro"];
const PLAN_STATUSES = ["active", "trialing", "canceled", "past_due"];

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [planTier, setPlanTier] = useState("");
  const [planStatus, setPlanStatus] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/users/${uid}`, {});
      if (!res.ok) return;
      const d = await res.json();
      setData(d);
      setPlanTier(d.user.planTier ?? "none");
      setPlanStatus(d.user.planStatus ?? "");
    }
    load();
  }, [uid]);

  async function savePlan() {
    setSaving(true);
    await fetch(`/api/admin/users/${uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTier, planStatus }),
    });
    setSaving(false);
  }

  if (!data) return <p className="text-muted-foreground text-sm">Loading…</p>;

  const { user, articles, sites } = data;
  const usage = user.usage ?? {};

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.displayName ?? "No display name"} · {uid}</p>
        </div>
        <button
          onClick={async () => {
            if (!confirm("Delete this user and all their data? This cannot be undone.")) return;
            await fetch(`/api/admin/users/${uid}/delete`, {
              method: "DELETE",
            });
            router.push("/admin/users");
          }}
          className="text-sm text-destructive border border-destructive/30 rounded px-3 py-1.5 hover:bg-destructive/10"
        >
          Delete User
        </button>
      </div>

      {/* Plan management */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium">Plan Management</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Plan Tier</label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              {PLAN_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Plan Status</label>
            <select
              value={planStatus}
              onChange={(e) => setPlanStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="">—</option>
              {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={savePlan}
            disabled={saving}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium mb-3">Usage This Period</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Articles", usage.articlesUsed ?? 0],
            ["AI Improvements", usage.aiImprovementsUsed ?? 0],
            ["Section Regen", usage.sectionRegenerationsUsed ?? 0],
            ["Research Queries", usage.researchQueriesUsed ?? 0],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div>
        <h2 className="text-sm font-medium mb-3">Recent Articles ({articles.length})</h2>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["Title", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{a.title ?? "Untitled"}</td>
                  <td className="px-4 py-2 text-muted-foreground capitalize">{a.status ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No articles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sites */}
      <div>
        <h2 className="text-sm font-medium mb-3">Sites ({sites.length})</h2>
        <div className="flex gap-2 flex-wrap">
          {sites.map((s: any) => (
            <div key={s.id} className="rounded border px-3 py-2 text-sm">
              <p className="font-medium">{s.name ?? "Unnamed"}</p>
              <p className="text-xs text-muted-foreground">{s.url ?? s.niche ?? "—"}</p>
            </div>
          ))}
          {sites.length === 0 && <p className="text-sm text-muted-foreground">No sites</p>}
        </div>
      </div>
    </div>
  );
}
