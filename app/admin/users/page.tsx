"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { 
  Users, 
  Search, 
  Trash2, 
  Crown, 
  Zap, 
  Calendar,
  Mail,
  User,
  CheckSquare,
  Square,
  MoreVertical,
  Eye,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  uid: string;
  email: string;
  displayName: string | null;
  planTier: string;
  planStatus: string | null;
  articleCountThisPeriod: number;
  createdAt: { seconds: number } | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  async function getToken() {
    return getFirebaseAuth().currentUser?.getIdToken();
  }

  async function fetchUsers(cursor?: string) {
    const token = await getToken();
    if (!token) return;
    const url = `/api/admin/users${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    setUsers((prev) => cursor ? [...prev, ...data.users] : data.users);
    setNextCursor(data.nextCursor);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function deleteSingle(uid: string) {
    if (!confirm("Delete this user and all their data?")) return;
    const token = await getToken();
    await fetch(`/api/admin/users/${uid}/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
    setSelected((prev) => { const s = new Set(prev); s.delete(uid); return s; });
  }

  async function batchDelete() {
    const uids = [...selected];
    if (!confirm(`Delete ${uids.length} users and all their data? This cannot be undone.`)) return;
    setDeleting(true);
    const token = await getToken();
    await fetch("/api/admin/users/batch-delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uids }),
    });
    setUsers((prev) => prev.filter((u) => !selected.has(u.uid)));
    setSelected(new Set());
    setDeleting(false);
  }

  function toggleSelect(uid: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(uid) ? s.delete(uid) : s.add(uid);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.uid)));
    }
  }

  const filtered = search
    ? users.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal/20 to-lilac/20 flex items-center justify-center">
          <Users className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} users total</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="search-glow-wrapper flex-1 max-w-md">
          <div className="search-glow" />
          <div className="relative z-10">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/30 transition-all"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-500">
                {selected.size} selected
              </span>
            </div>
            <button
              onClick={batchDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-muted/30">
          <button
            onClick={toggleAll}
            className="flex items-center justify-center w-5 h-5"
          >
            {selected.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-gold" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div className="grid grid-cols-6 gap-4 flex-1 text-xs font-mono-dm font-bold uppercase tracking-widest text-muted-foreground">
            <span>User</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Articles</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search ? "No users match your search" : "No users found"}
              </p>
            </div>
          ) : (
            filtered.map((user) => (
              <div
                key={user.uid}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors",
                  selected.has(user.uid) && "bg-gold/5 border-l-4 border-l-gold"
                )}
              >
                <button
                  onClick={() => toggleSelect(user.uid)}
                  className="flex items-center justify-center w-5 h-5"
                >
                  {selected.has(user.uid) ? (
                    <CheckSquare className="h-4 w-4 text-gold" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground hover:text-gold transition-colors" />
                  )}
                </button>

                <div className="grid grid-cols-6 gap-4 flex-1 items-center">
                  {/* User Info */}
                  <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push(`/admin/users/${user.uid}`)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold/10 to-teal/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.displayName || "No name"}
                      </p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="flex items-center gap-2">
                    {user.planTier === 'pro' ? (
                      <Crown className="h-4 w-4 text-gold" />
                    ) : user.planTier === 'starter' ? (
                      <Zap className="h-4 w-4 text-teal" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-sm font-semibold capitalize",
                      user.planTier === 'pro' ? 'text-gold' : 
                      user.planTier === 'starter' ? 'text-teal' : 
                      'text-muted-foreground'
                    )}>
                      {user.planTier}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold",
                      user.planStatus === 'active' ? 'bg-teal/10 text-teal' :
                      user.planStatus === 'canceled' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {user.planStatus || 'free'}
                    </span>
                  </div>

                  {/* Articles */}
                  <div className="text-sm font-semibold text-foreground">
                    {user.articleCountThisPeriod}
                  </div>

                  {/* Joined */}
                  <div className="text-xs text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/users/${user.uid}`)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSingle(user.uid)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Load More */}
      {nextCursor && (
        <div className="text-center">
          <button
            onClick={() => fetchUsers(nextCursor)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:border-gold/30 hover:bg-gold/5 transition-all"
          >
            Load more users
          </button>
        </div>
      )}
    </div>
  );
}
