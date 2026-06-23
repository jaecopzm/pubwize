"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Globe, Pencil, Trash2, TrendingUp, Calendar, Search, Grid3x3, List, BarChart3, ExternalLink, Activity, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; siteId: string; siteName: string }>({
    isOpen: false,
    siteId: '',
    siteName: '',
  });

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      // Fetch sites
      const sitesRes = await fetch("/api/sites", {
      });

      if (!sitesRes.ok) {
        throw new Error('Failed to fetch sites');
      }

      const sitesData = await sitesRes.json();

      // Fetch articles to count per site
      const articlesRes = await fetch("/api/articles", {
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
        createdAt: site.createdAt?._seconds 
          ? new Date(site.createdAt._seconds * 1000)
          : site.createdAt 
          ? new Date(site.createdAt)
          : new Date(),
        status: 'online', // Mocked but visual
      }));

      setSites(sites);

      // Fetch topic suggestions for Pro users (async, don't block)
      if (plan === 'pro') {
        fetchTopicSuggestions(sites);
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTopicSuggestions(sites: Site[]) {
    // Fetch suggestions for each site (limit to first 3 to avoid rate limits)
    const sitesToFetch = sites.slice(0, 3);
    
    for (const site of sitesToFetch) {
      try {
        const res = await fetch('/api/sites/suggest-topic', {
          method: 'POST',
          headers: {
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
    try {
      setDeleting(siteId);

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Site deleted successfully');
      setSites(sites.filter(s => s.id !== siteId));
      setDeleteDialog({ isOpen: false, siteId: '', siteName: '' });
    } catch (error) {
      toast.error('Failed to delete site');
    } finally {
      setDeleting(null);
    }
  }

  function openDeleteDialog(siteId: string, siteName: string) {
    setDeleteDialog({ isOpen: true, siteId, siteName });
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Your Sites
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sites.length} {sites.length === 1 ? 'site' : 'sites'} configured
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/sites/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Site</span>
            <span className="sm:hidden">Add Site</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && sites.length > 0 && (
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
          {[
            { icon: Globe, label: 'Sites', value: stats.total, color: 'text-cyan-500' },
            { icon: BarChart3, label: 'Articles', value: stats.totalArticles, color: 'text-primary' },
            { icon: TrendingUp, label: 'Niches', value: stats.niches, color: 'text-primary' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-3 lg:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-[10px] lg:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 rounded-lg bg-muted/50 animate-pulse" />
                  <div className="h-4 w-40 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '150ms' }} />
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted/50 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <div className="mb-4">
                <div className="h-6 w-20 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: '450ms' }} />
              </div>
              <div className="mb-4 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <div className="h-4 w-16 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '600ms' }} />
                  <div className="h-4 w-8 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '750ms' }} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-9 rounded-xl bg-muted/50 animate-pulse" style={{ animationDelay: '900ms' }} />
                <div className="h-9 w-9 rounded-xl bg-muted/50 animate-pulse" style={{ animationDelay: '1050ms' }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/50 p-8 sm:p-12 lg:p-16 text-center">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>

          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">
            Your Library is Waiting
          </h3>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Create your first site to unlock AI-powered content generation. Each site can have its own niche, brand voice, and target audience.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            {[
              { icon: Sparkles, label: "AI-Powered", desc: "Smart content generation" },
              { icon: TrendingUp, label: "SEO Optimized", desc: "Rank higher on Google" },
              { icon: Activity, label: "Multi-Site", desc: "Manage unlimited sites" },
            ].map((feature, i) => (
              <div
                key={feature.label}
                className="p-4 rounded-xl bg-card/50 border border-border/50"
              >
                <feature.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground mb-1">{feature.label}</p>
                <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          <button
            className="btn-gold text-sm sm:text-base px-6 py-3"
            onClick={() => router.push("/dashboard/sites/new")}
          >
            <Plus className="h-4 w-4" />
            Create Your First Site
          </button>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="card-premium p-6 sm:p-8 text-center relative z-10">
          <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">No sites match your search</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3 relative z-10">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="card-premium p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0">
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
                    onClick={() => openDeleteDialog(site.id, site.siteName)}
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
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site, index) => (
            <div
              key={site.id}
              className="group rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6"
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0 ml-3">
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
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">Live</span>
                  </span>
                </div>
              </div>

              {/* Pro Feature: Suggested Next Topic */}
              {plan === 'pro' && (
                <div className="mb-5 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    <span className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">Next Topic Idea</span>
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
                    className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-violet-500 hover:underline"
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
                  onClick={() => openDeleteDialog(site.id, site.siteName)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, siteId: '', siteName: '' })}
        onConfirm={() => deleteSite(deleteDialog.siteId, deleteDialog.siteName)}
        title="Delete Site?"
        description={`Are you sure you want to delete "${deleteDialog.siteName}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Site"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting === deleteDialog.siteId}
      />
    </div>
  );
}
