"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Plus, Globe, Pencil, Trash2, TrendingUp, Calendar, Search, Grid3x3, List, BarChart3, ExternalLink, Activity, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";

interface Site {
  id: string;
  domain: string;
  siteName: string;
  niche: string;
  articleCount: number;
  createdAt: Date;
  suggestedTopic?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'articles';

export default function SitesPage() {
  const router = useRouter();
  const { plan } = useUserPlan();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setLoading(false);
        return;
      }

      // Fetch sites
      const sitesRes = await fetch("/api/sites", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!sitesRes.ok) {
        throw new Error('Failed to fetch sites');
      }

      const sitesData = await sitesRes.json();

      // Fetch articles to count per site
      const articlesRes = await fetch("/api/articles", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      let articleCounts: Record<string, number> = {};

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        // Count articles per site
        articleCounts = articlesData.articles.reduce((acc: Record<string, number>, article: any) => {
          const siteId = article.siteId;
          if (siteId) {
            acc[siteId] = (acc[siteId] || 0) + 1;
          }
          return acc;
        }, {});
      }

      const sites = sitesData.sites.map((site: any) => ({
        id: site.id,
        domain: site.domain,
        siteName: site.siteName,
        niche: site.niche,
        articleCount: articleCounts[site.id] || 0,
        createdAt: new Date(site.createdAt._seconds * 1000),
        status: 'online', // Mocked but visual
      }));

      setSites(sites);

      // Fetch topic suggestions for Pro users (async, don't block)
      if (plan === 'pro') {
        fetchTopicSuggestions(sites, idToken);
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTopicSuggestions(sites: Site[], idToken: string) {
    // Fetch suggestions for each site (limit to first 3 to avoid rate limits)
    const sitesToFetch = sites.slice(0, 3);
    
    for (const site of sitesToFetch) {
      try {
        const res = await fetch('/api/sites/suggest-topic', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ siteId: site.id }),
        });

        if (res.ok) {
          const { topic } = await res.json();
          setSites(prev => prev.map(s => 
            s.id === site.id ? { ...s, suggestedTopic: topic } : s
          ));
        }
      } catch (error) {
        console.error(`Failed to fetch topic for site ${site.id}:`, error);
      }
    }
  }

  async function deleteSite(siteId: string, siteName: string) {
    if (!confirm(`Delete "${siteName}"? This cannot be undone.`)) return;

    try {
      setDeleting(siteId);
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) return;

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Site deleted successfully');
      setSites(sites.filter(s => s.id !== siteId));
    } catch (error) {
      toast.error('Failed to delete site');
    } finally {
      setDeleting(null);
    }
  }

  // Filter and sort sites
  const filteredSites = sites
    .filter(site =>
      site.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.niche.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.siteName.localeCompare(b.siteName);
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'articles':
          return b.articleCount - a.articleCount;
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: sites.length,
    totalArticles: sites.reduce((sum, site) => sum + site.articleCount, 0),
    niches: new Set(sites.map(s => s.niche)).size,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto aurora-bg noise-overlay min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Your <span className="gradient-gold-teal">Sites</span>
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">
            {sites.length} {sites.length === 1 ? 'site' : 'sites'} configured
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/sites/new")}
          className="btn-gold w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Site</span>
          <span className="sm:hidden">Add Site</span>
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && sites.length > 0 && (
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6 relative z-10">
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-teal" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Sites</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-gold" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Articles</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.totalArticles}</p>
          </div>
          <div className="card-premium p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-lilac" />
              <span className="font-mono-dm text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Niches</span>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.niches}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!loading && sites.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 lg:mb-6 relative z-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* View Mode & Sort */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card/50">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer touch-manipulation"
            >
              <option value="date">Latest</option>
              <option value="name">Name</option>
              <option value="articles">Articles</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className={cn(
          "grid gap-4 lg:gap-6 relative z-10",
          viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 rounded shimmer bg-muted" />
                  <div className="h-4 w-40 rounded shimmer bg-muted" />
                </div>
                <div className="h-10 w-10 rounded-xl shimmer bg-muted" />
              </div>
              <div className="mb-4">
                <div className="h-6 w-20 rounded-full shimmer bg-muted" />
              </div>
              <div className="mb-4 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <div className="h-4 w-16 rounded shimmer bg-muted" />
                  <div className="h-4 w-8 rounded shimmer bg-muted" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-9 rounded-xl shimmer bg-muted" />
                <div className="h-9 w-9 rounded-xl shimmer bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="rounded-xl lg:rounded-2xl border border-dashed border-border p-8 lg:p-12 text-center card-premium relative z-10">
          <div className="mx-auto flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-2xl bg-teal/10">
            <Globe className="h-7 w-7 lg:h-8 lg:w-8 text-teal" />
          </div>
          <h3 className="mt-4 lg:mt-6 text-base lg:text-lg font-bold font-display text-foreground">No sites yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first site to start generating articles.
          </p>
          <button
            className="btn-gold mt-4 lg:mt-6"
            onClick={() => router.push("/dashboard/sites/new")}
          >
            <Plus className="h-4 w-4" />
            Create Site
          </button>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="card-premium p-8 text-center relative z-10">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No sites match your search</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3 relative z-10">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="card-premium p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal flex-shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm lg:text-base mb-1 truncate text-foreground">
                    {site.siteName}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://${site.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs lg:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                    >
                      {site.domain}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <span className="badge-gold text-[10px]">{site.niche}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 text-xs">
                  <div className="text-center">
                    <p className="font-mono-dm text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Articles</p>
                    <p className="font-bold text-foreground">{site.articleCount}</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="font-mono-dm text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Created</p>
                    <p className="font-bold text-foreground text-xs">
                      {site.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-gold/30 hover:text-gold transition-all"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => deleteSite(site.id, site.siteName)}
                    disabled={deleting === site.id}
                    className="flex items-center justify-center rounded-xl border border-border bg-muted/30 px-3 py-2 text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="group rounded-xl lg:rounded-2xl border border-border p-4 lg:p-6 transition-all card-premium"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm lg:text-base mb-1 truncate text-foreground">
                    {site.siteName}
                  </h3>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs lg:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group/link truncate"
                  >
                    <span className="truncate">{site.domain}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal flex-shrink-0 ml-3">
                  <Globe className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-4">
                <span className="badge-gold text-[10px]">
                  {site.niche}
                </span>
              </div>

              <div className="metric-group mb-5">
                <div className="metric">
                  <span className="metric-label">Articles</span>
                  <span className="metric-value font-display">{site.articleCount}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Status</span>
                  <span className="metric-value flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
                    </span>
                    <span className="text-[10px] text-teal/80 font-bold uppercase tracking-wider">Live</span>
                  </span>
                </div>
              </div>

              {/* Pro Feature: Suggested Next Topic */}
              {plan === 'pro' && (
                <div className="mb-5 p-3 rounded-xl bg-lilac/5 border border-lilac/10 group-hover:border-lilac/20 transition-all">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3 text-lilac" />
                    <span className="text-[9px] font-bold text-lilac uppercase tracking-widest">Next Topic Idea</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {site.suggestedTopic ? (
                      <>
                        Suggested: <span className="text-foreground font-semibold">"{site.suggestedTopic}"</span>
                      </>
                    ) : (
                      <>
                        Latest trend in {site.niche}: <span className="text-foreground font-semibold">"How to scale {site.niche} in 2026"</span>
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/articles/new?keyword=${encodeURIComponent(site.suggestedTopic || `How to scale ${site.niche} in 2026`)}&siteId=${site.id}`)}
                    className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-lilac hover:underline"
                  >
                    Create Article <ChevronRight size={10} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-gold/30 hover:text-gold active:scale-95 transition-all touch-manipulation"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => deleteSite(site.id, site.siteName)}
                  disabled={deleting === site.id}
                  className="flex items-center justify-center rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-muted-foreground hover:border-destructive/30 hover:text-destructive active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
