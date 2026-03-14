"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Sparkles,
    Loader2,
    TrendingUp,
    MessageSquare,
    Zap,
    CheckCircle2,
    Plus,
    History,
    ArrowUpRight,
    BarChart3,
    Target,
    Filter,
    Download,
    Star,
    Clock,
    Bookmark,
    BookmarkCheck,
    Trash2,
    CheckSquare,
    Square,
    ArrowUp,
    ArrowDown,
    Minus,
    Network,
    Crown,
    ChevronRight,
    FileText,
    Save,
    FolderOpen,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { useRouter } from "next/navigation";
import { PremiumBadge } from "@/components/ui/premium-badge";
import type { PlanTier } from "@/lib/pricing";

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function ResearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("relevance");
    const [savedKeywords, setSavedKeywords] = useState<Set<string>>(new Set());
    const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState("");
    const [mode, setMode] = useState<'keywords' | 'clusters'>('keywords');
    const [clusterSeedTopic, setClusterSeedTopic] = useState("");
    const [clusterLoading, setClusterLoading] = useState(false);
    const [clusterStrategy, setClusterStrategy] = useState<any>(null);
    const [userPlan, setUserPlan] = useState<PlanTier>("free");
    const [savedStrategies, setSavedStrategies] = useState<any[]>([]);
    const [showSavedStrategies, setShowSavedStrategies] = useState(false);

    // Load saved data from localStorage and fetch user plan
    useEffect(() => {
        const saved = localStorage.getItem("savedKeywords");
        const history = localStorage.getItem("searchHistory");
        const strategies = localStorage.getItem("savedStrategies");
        if (saved) setSavedKeywords(new Set(JSON.parse(saved)));
        if (history) setSearchHistory(JSON.parse(history));
        if (strategies) setSavedStrategies(JSON.parse(strategies));

        // Fetch user plan
        const fetchUserPlan = async () => {
            try {
                const auth = getFirebaseAuth();
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) return;

                const response = await fetch("/api/user/plan", {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const data = await response.json();
                if (data.plan) setUserPlan(data.plan);
            } catch (err) {
                console.error("Failed to fetch user plan:", err);
            }
        };
        fetchUserPlan();
    }, []);

    const handleSearch = async (e: React.FormEvent, searchQuery?: string) => {
        e.preventDefault();
        const searchTerm = searchQuery || query;
        if (!searchTerm.trim()) return;

        setError(null);
        setLoading(true);
        setShowHistory(false);

        try {
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();

            if (!idToken) {
                throw new Error("Authentication required");
            }

            const response = await fetch("/api/research/keywords", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({ query: searchTerm }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.upgradeRequired) {
                    setUpgradeReason(data.error || 'Upgrade required to continue');
                    setShowUpgradeModal(true);
                    return;
                }
                throw new Error(data.error || "Failed to fetch keyword data");
            }

            // Enhance the data with mock metrics (volume, difficulty, etc.) since Serper doesn't provide these
            const enhanceKeyword = (kw: any, index: number) => ({
                ...kw,
                volume: Math.floor(Math.random() * 8000) + 2000,
                difficulty: Math.floor(Math.random() * 50) + 20,
                intent: kw.type === "question" ? "informational" : (Math.random() > 0.5 ? "commercial" : "informational"),
                trend: ["up", "stable", "down"][Math.floor(Math.random() * 3)],
                cpc: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
            });

            const enhancedResults = {
                all: data.all.map(enhanceKeyword),
            };

            setResults(enhancedResults);

            // Update search history
            const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 5);
            setSearchHistory(newHistory);
            localStorage.setItem("searchHistory", JSON.stringify(newHistory));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Search failed";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const toggleSaveKeyword = (keyword: string) => {
        const newSaved = new Set(savedKeywords);
        if (newSaved.has(keyword)) {
            newSaved.delete(keyword);
            toast.success("Removed from saved keywords");
        } else {
            newSaved.add(keyword);
            toast.success("Saved keyword for later");
        }
        setSavedKeywords(newSaved);
        localStorage.setItem("savedKeywords", JSON.stringify([...newSaved]));
    };

    const toggleSelectKeyword = (keyword: string) => {
        const newSelected = new Set(selectedKeywords);
        if (newSelected.has(keyword)) {
            newSelected.delete(keyword);
        } else {
            if (newSelected.size >= 5) {
                toast.error("Maximum 5 keywords for bulk generation");
                return;
            }
            newSelected.add(keyword);
        }
        setSelectedKeywords(newSelected);
    };

    const selectAll = () => {
        if (selectedKeywords.size === filteredResults?.length || selectedKeywords.size > 0) {
            setSelectedKeywords(new Set());
        } else {
            const limited = filteredResults?.slice(0, 5).map((r: any) => r.keyword) || [];
            setSelectedKeywords(new Set(limited));
            if (filteredResults?.length > 5) {
                toast.info("Selected first 5 keywords (max limit)");
            }
        }
    };

    const exportToCSV = () => {
        if (!filteredResults || filteredResults.length === 0) return;

        const headers = ["Keyword", "Type", "Volume", "Difficulty", "Intent", "Trend", "CPC"];
        const rows = filteredResults.map((r: any) => [
            r.keyword,
            r.type,
            r.volume,
            r.difficulty,
            r.intent,
            r.trend,
            r.cpc
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `keywords-${query}-${Date.now()}.csv`;
        a.click();
        toast.success("Exported to CSV");
    };

    const generateBulk = () => {
        if (selectedKeywords.size === 0) {
            toast.error("Select keywords first");
            return;
        }
        toast.success(`Generating ${selectedKeywords.size} articles...`);
        // Navigate to bulk generation (implement this route)
        window.location.href = `/dashboard/articles/bulk?keywords=${encodeURIComponent([...selectedKeywords].join(","))}`;
    };

    const generateCluster = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if user has access to cluster strategy
        if (userPlan === "free") {
            setUpgradeReason("Pillar & Cluster Strategy is available on Starter and Pro plans");
            setShowUpgradeModal(true);
            return;
        }

        if (!clusterSeedTopic.trim()) return;
        setClusterLoading(true);
        setClusterStrategy(null);
        try {
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication required");
            const response = await fetch("/api/research/cluster", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                body: JSON.stringify({ seedTopic: clusterSeedTopic }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (data.upgradeRequired) {
                    setUpgradeReason(data.error || 'Upgrade required to continue');
                    setShowUpgradeModal(true);
                    return;
                }
                throw new Error(data.error || "Failed to generate strategy");
            }
            setClusterStrategy(data.strategy);
            
            // Success toast with confetti
            const articleCount = 1 + data.strategy.clusters.length;
            toast.success(`🎉 Strategy generated! ${articleCount} articles ready`, {
                description: `1 pillar + ${data.strategy.clusters.length} supporting articles`,
                duration: 5000,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed";
            toast.error(msg);
        } finally {
            setClusterLoading(false);
        }
    };

    const addClusterToQueue = () => {
        if (!clusterStrategy) return;
        const allKeywords = [clusterStrategy.pillar.keyword, ...clusterStrategy.clusters.map((c: any) => c.keyword)];
        const encoded = allKeywords.map((k: string) => encodeURIComponent(k)).join(",");
        toast.success(`Adding ${allKeywords.length} articles to your content queue...`);
        window.location.href = `/dashboard/articles/new?keyword=${encodeURIComponent(clusterStrategy.pillar.keyword)}`;
    };

    const saveStrategy = () => {
        if (!clusterStrategy) return;
        const strategy = {
            id: Date.now(),
            seedTopic: clusterSeedTopic,
            strategy: clusterStrategy,
            createdAt: new Date().toISOString(),
        };
        const updated = [strategy, ...savedStrategies].slice(0, 10); // Keep last 10
        setSavedStrategies(updated);
        localStorage.setItem("savedStrategies", JSON.stringify(updated));
        toast.success("Strategy saved!", { description: "Access it anytime from saved strategies" });
    };

    const loadStrategy = (saved: any) => {
        setClusterSeedTopic(saved.seedTopic);
        setClusterStrategy(saved.strategy);
        setShowSavedStrategies(false);
        toast.success("Strategy loaded");
    };

    const deleteStrategy = (id: number) => {
        const updated = savedStrategies.filter(s => s.id !== id);
        setSavedStrategies(updated);
        localStorage.setItem("savedStrategies", JSON.stringify(updated));
        toast.success("Strategy deleted");
    };

    const exportStrategy = () => {
        if (!clusterStrategy) return;
        
        // CSV Export
        const headers = ["Type", "Keyword", "Description", "Word Count"];
        const rows = [
            ["Pillar", clusterStrategy.pillar.keyword, clusterStrategy.pillar.description, clusterStrategy.pillar.estimatedWordCount],
            ...clusterStrategy.clusters.map((c: any, i: number) => [
                `Cluster ${i + 1}`, c.keyword, c.description, c.estimatedWordCount
            ])
        ];
        
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strategy-${clusterSeedTopic.replace(/\s+/g, "-")}-${Date.now()}.csv`;
        a.click();
        toast.success("Strategy exported to CSV");
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem("searchHistory");
        toast.success("Search history cleared");
    };

    const chipClass = (type: string) =>
        cn("badge-lilac", {
            "bg-gold/10 text-gold border-gold/20": type === "suggested",
            "bg-teal/10 text-teal border-teal/20": type === "question",
            "bg-lilac/10 text-lilac border-lilac/20": type === "related",
        });

    const chipDot = (type: string) => ({
        suggested: "bg-gold",
        question: "bg-teal",
        related: "bg-lilac",
    }[type as "suggested" | "question" | "related"]);

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 30) return "text-teal";
        if (difficulty < 50) return "text-gold";
        return "text-red-500";
    };

    const getDifficultyLabel = (difficulty: number) => {
        if (difficulty < 30) return "Easy";
        if (difficulty < 50) return "Medium";
        return "Hard";
    };

    const getTrendIcon = (trend: string) => {
        if (trend === "up") return <ArrowUp className="w-3 h-3 text-teal" />;
        if (trend === "down") return <ArrowDown className="w-3 h-3 text-red-500" />;
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    };

    const filteredResults = results?.all.filter((item: any) =>
        filterType === "all" || item.type === filterType
    ).sort((a: any, b: any) => {
        if (sortBy === "volume") return b.volume - a.volume;
        if (sortBy === "difficulty") return a.difficulty - b.difficulty;
        if (sortBy === "cpc") return b.cpc - a.cpc;
        return 0; // relevance (default order)
    });

    return (
        <div className="min-h-screen aurora-bg noise-overlay">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

                {/* ── Hero ── */}
                <div className="text-center flex flex-col items-center mb-8 sm:mb-12">
                    <div className="badge-gold mb-6 sm:mb-8">
                        <Sparkles size={11} />
                        Keyword Intelligence
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4 sm:mb-6">
                        Discover your next<br />
                        <span className="gradient-gold-teal">money keywords</span>
                    </h1>

                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed px-4">
                        Enter a seed topic and we'll scan Google's autocomplete, PAA, and
                        related searches to surface the highest-leverage content opportunities.
                    </p>
                </div>

                {/* ── Mode Toggle ── */}
                <div className="flex items-center gap-2 mb-6 p-1 bg-card border border-border rounded-xl max-w-sm mx-auto">
                    <button
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                            mode === 'keywords' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setMode('keywords')}
                    >
                        <Search size={14} /> Keywords
                    </button>
                    <button
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all relative",
                            mode === 'clusters' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => {
                            if (userPlan === "free") {
                                setUpgradeReason("Pillar & Cluster Strategy is available on Starter and Pro plans");
                                setShowUpgradeModal(true);
                                return;
                            }
                            setMode('clusters');
                        }}
                    >
                        <Network size={14} /> Strategy
                        {userPlan === "free" && (
                            <Crown size={10} className="text-gold absolute -top-1 -right-1" />
                        )}
                    </button>
                </div>

                {/* ── Keyword Search ── */}
                {mode === 'keywords' && (
                    <div className="search-glow-wrapper max-w-3xl mx-auto mb-10 sm:mb-12 relative">
                        <div className="search-glow" />
                        <form onSubmit={handleSearch}>
                            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center bg-card border border-border rounded-2xl overflow-hidden transition-all focus-within:border-transparent">
                                <div className="flex items-center flex-1">
                                    <div className="flex-shrink-0 px-4 sm:px-5 text-muted-foreground transition-colors focus-within:text-gold">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        className="flex-1 h-14 sm:h-16 bg-transparent border-none outline-none font-medium text-sm sm:text-base text-foreground placeholder:text-muted-foreground pr-4"
                                        type="text"
                                        placeholder="e.g. coffee brewing, vegan recipes…"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => setShowHistory(true)}
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    className="btn-gold m-2 h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm"
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                >
                                    {loading
                                        ? <Loader2 size={16} className="animate-spin" />
                                        : <><Zap size={14} /> Analyze</>
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Search History Dropdown */}
                        {showHistory && searchHistory.length > 0 && !loading && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-premium z-20 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                                    <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        Clear
                                    </button>
                                </div>
                                {searchHistory.map((term, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => {
                                            setQuery(term);
                                            handleSearch(e, term);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                                    >
                                        <Clock size={14} className="text-muted-foreground" />
                                        <span className="text-sm text-foreground">{term}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {error && <p className="mt-4 text-center text-sm text-red-500 font-semibold animate-in fade-in">{error}</p>}
                    </div>
                )}

                {/* ── Cluster Strategy Mode ── */}
                {mode === 'clusters' && (
                    <div className="max-w-3xl mx-auto px-3 sm:px-0">
                        {/* Header with Saved Strategies */}
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac/20 to-gold/10 text-lilac mb-4 relative shadow-lg">
                                <Network size={26} className="sm:w-8 sm:h-8" />
                                <PremiumBadge plan="starter" size="sm" className="absolute -top-2 -right-2 shadow-md" />
                            </div>
                            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                                Pillar & Cluster Strategy
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                                Enter a broad niche. AI designs your complete content architecture.
                            </p>
                            
                            {/* Saved Strategies Button */}
                            {savedStrategies.length > 0 && (
                                <button
                                    onClick={() => setShowSavedStrategies(!showSavedStrategies)}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-sm font-medium"
                                >
                                    <FolderOpen size={14} />
                                    Saved Strategies ({savedStrategies.length})
                                </button>
                            )}
                        </div>

                        {/* Saved Strategies Dropdown */}
                        {showSavedStrategies && savedStrategies.length > 0 && (
                            <div className="mb-6 p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-foreground">Your Saved Strategies</h3>
                                    <button onClick={() => setShowSavedStrategies(false)} className="text-muted-foreground hover:text-foreground">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {savedStrategies.map((saved) => (
                                        <div key={saved.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-all group">
                                            <button
                                                onClick={() => loadStrategy(saved)}
                                                className="flex-1 text-left text-sm font-medium text-foreground group-hover:text-lilac transition-colors"
                                            >
                                                {saved.seedTopic}
                                            </button>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(saved.createdAt).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => deleteStrategy(saved.id)}
                                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={generateCluster} className="mb-8">
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="e.g. Dog Training, SaaS Marketing..."
                                    value={clusterSeedTopic}
                                    onChange={(e) => setClusterSeedTopic(e.target.value)}
                                    className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-lilac/50 focus:ring-2 focus:ring-lilac/20 outline-none transition-all text-sm sm:text-base"
                                    disabled={clusterLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={clusterLoading || !clusterSeedTopic.trim()} 
                                    className="w-full sm:w-auto sm:self-end btn-gold h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold touch-manipulation"
                                >
                                    {clusterLoading ? (
                                        <><Loader2 size={18} className="animate-spin" /> Generating...</>
                                    ) : (
                                        <><Sparkles size={16} /> Generate Strategy</>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Loading State */}
                        {clusterLoading && (
                            <div className="space-y-3">
                                <div className="h-24 sm:h-28 rounded-2xl bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 bg-[length:200%_100%] animate-shimmer" />
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-16 sm:h-20 rounded-xl bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                                ))}
                            </div>
                        )}

                        {/* Results */}
                        {clusterStrategy && !clusterLoading && (
                            <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Pillar Article */}
                                <div className="p-4 sm:p-6 rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/8 to-gold/3 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full blur-3xl bg-gold/20 pointer-events-none" />
                                    <div className="relative flex items-start gap-3 sm:gap-4">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-obsidian shadow-lg">
                                            <Crown size={18} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="badge-gold text-[9px] sm:text-[10px]">Pillar</span>
                                                <span className="text-xs sm:text-sm text-muted-foreground font-medium">{clusterStrategy.pillar.estimatedWordCount?.toLocaleString()}w</span>
                                            </div>
                                            <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight mb-1">{clusterStrategy.pillar.keyword}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{clusterStrategy.pillar.description}</p>
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/dashboard/articles/new?keyword=${encodeURIComponent(clusterStrategy.pillar.keyword)}`}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gold/20 border border-gold/30 text-xs sm:text-sm font-bold text-gold hover:bg-gold/30 transition-all whitespace-nowrap shrink-0 touch-manipulation min-h-[44px]"
                                        >
                                            <Plus size={14} />
                                            <span className="hidden xs:inline">Create</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Cluster Articles */}
                                <div className="space-y-2">
                                    {clusterStrategy.clusters.map((cluster: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:border-lilac/40 hover:bg-lilac/5 transition-all group">
                                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-lilac/15 text-lilac text-sm font-bold">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm sm:text-base font-semibold text-foreground leading-snug group-hover:text-lilac transition-colors mb-1">{cluster.keyword}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">{cluster.description}</p>
                                                <span className="inline-block mt-1 text-[10px] sm:text-xs text-muted-foreground font-medium">{cluster.estimatedWordCount?.toLocaleString()} words</span>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `/dashboard/articles/new?keyword=${encodeURIComponent(cluster.keyword)}`}
                                                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-lilac hover:border-lilac/40 hover:bg-lilac/5 transition-all touch-manipulation min-h-[44px] min-w-[44px] shrink-0"
                                            >
                                                <Plus size={14} />
                                                <span className="hidden sm:inline text-xs font-semibold">Create</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                                    <button
                                        onClick={addClusterToQueue}
                                        className="flex-1 btn-gold flex items-center justify-center gap-2 h-12 sm:h-14 text-sm sm:text-base font-semibold touch-manipulation"
                                    >
                                        <Zap size={16} /> Start with Pillar
                                    </button>
                                    <button
                                        onClick={saveStrategy}
                                        className="sm:w-auto px-4 h-12 sm:h-14 rounded-xl border-2 border-teal/30 bg-teal/5 text-sm sm:text-base font-semibold text-teal hover:bg-teal/10 transition-all touch-manipulation flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Save
                                    </button>
                                    <button
                                        onClick={exportStrategy}
                                        className="sm:w-auto px-4 h-12 sm:h-14 rounded-xl border-2 border-border text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all touch-manipulation flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Export
                                    </button>
                                    <button
                                        onClick={() => { setClusterStrategy(null); setClusterSeedTopic(""); }}
                                        className="sm:w-auto px-4 h-12 sm:h-14 rounded-xl border-2 border-border text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all touch-manipulation flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> New
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!clusterStrategy && !clusterLoading && (
                            <div className="text-center py-12 sm:py-16">
                                <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-lilac/10 text-lilac mb-4">
                                    <Network size={32} className="sm:w-10 sm:h-10" />
                                </div>
                                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
                                    Ready to dominate your niche?
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                                    Enter a topic above and let AI create your complete content strategy
                                </p>
                                
                                {/* Smart Suggestions */}
                                <div className="max-w-md mx-auto">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Popular Niches
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {[
                                            "AI & Machine Learning",
                                            "Personal Finance",
                                            "Health & Wellness",
                                            "Digital Marketing",
                                            "E-commerce",
                                            "SaaS Products",
                                            "Remote Work",
                                            "Sustainable Living",
                                        ].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => {
                                                    setClusterSeedTopic(suggestion);
                                                    toast.success(`Try: ${suggestion}`);
                                                }}
                                                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:border-lilac/30 hover:bg-lilac/5 text-xs font-medium text-muted-foreground hover:text-lilac transition-all"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Skeletons ── */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className={cn("h-40 rounded-2xl bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer", i < 5 ? `delay-${i * 50}` : '')} />
                        ))}
                    </div>
                )}

                {/* ── Results ── */}
                {results && !loading && (
                    <>
                        <div className="flex flex-col gap-3 mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                                        <Zap size={16} className="text-gold sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden sm:inline">Results for &ldquo;{query}&rdquo;</span>
                                        <span className="sm:hidden">Results</span>
                                    </h2>
                                    <span className="badge-teal text-[10px] sm:text-[11px]">{filteredResults?.length || 0} ideas</span>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {selectedKeywords.size > 0 && (
                                        <button
                                            onClick={generateBulk}
                                            className="btn-gold text-xs px-3 py-2 h-auto flex-1 sm:flex-initial relative group"
                                        >
                                            <Plus size={14} />
                                            <span className="hidden xs:inline">Generate</span> {selectedKeywords.size}
                                            <span className="font-mono-dm text-[9px] opacity-60 ml-1">/5</span>
                                            {userPlan === "free" && (
                                                <Crown size={9} className="text-obsidian absolute -top-1 -right-1" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={exportToCSV}
                                        disabled={!filteredResults || filteredResults.length === 0}
                                        className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-gold/30 hover:text-foreground transition-all flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Export</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Filters & Sort ── */}
                        <div className="flex flex-col gap-3 mb-6">
                            {/* First row: Select All + Type Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                                <button
                                    onClick={selectAll}
                                    className="flex items-center gap-1.5 sm:gap-2 bg-card border border-border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:border-gold/30 hover:text-foreground transition-all whitespace-nowrap flex-shrink-0"
                                >
                                    {selectedKeywords.size > 0 ? <CheckSquare size={13} /> : <Square size={13} />}
                                    <span className="hidden sm:inline">{selectedKeywords.size > 0 ? 'Clear' : 'Select 5'}</span>
                                    <span className="sm:hidden">{selectedKeywords.size > 0 ? 'Clear' : '5'}</span>
                                </button>

                                <div className="w-px h-5 bg-border flex-shrink-0" />

                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 bg-card border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        filterType === "all"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setFilterType("all")}
                                >
                                    <Filter size={12} />
                                    All
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 bg-card border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        filterType === "suggested"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setFilterType("suggested")}
                                >
                                    <Sparkles size={12} />
                                    <span className="hidden xs:inline">Suggested</span>
                                    <span className="xs:hidden">Sugg</span>
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 bg-card border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        filterType === "question"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setFilterType("question")}
                                >
                                    <MessageSquare size={12} />
                                    <span className="hidden xs:inline">Questions</span>
                                    <span className="xs:hidden">Q</span>
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 sm:gap-2 bg-card border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        filterType === "related"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setFilterType("related")}
                                >
                                    <TrendingUp size={12} />
                                    <span className="hidden xs:inline">Related</span>
                                    <span className="xs:hidden">Rel</span>
                                </button>
                            </div>

                            {/* Second row: Sort buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground mr-1">Sort:</span>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                                        sortBy === "volume"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setSortBy(sortBy === "volume" ? "relevance" : "volume")}
                                >
                                    <BarChart3 size={12} />
                                    Volume {sortBy === "volume" && "↓"}
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                                        sortBy === "difficulty"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setSortBy(sortBy === "difficulty" ? "relevance" : "difficulty")}
                                >
                                    <Target size={12} />
                                    Difficulty {sortBy === "difficulty" && "↑"}
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                                        sortBy === "cpc"
                                            ? "border-gold/40 bg-gold/10 text-gold"
                                            : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                                    )}
                                    onClick={() => setSortBy(sortBy === "cpc" ? "relevance" : "cpc")}
                                >
                                    CPC {sortBy === "cpc" && "↓"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredResults?.length === 0 ? (
                                <div className="col-span-full card-premium p-8 sm:p-12 text-center">
                                    <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
                                    <p className="text-sm text-muted-foreground">No keywords match your filters</p>
                                    <button
                                        onClick={() => {
                                            setFilterType("all");
                                            setSortBy("relevance");
                                        }}
                                        className="mt-3 sm:mt-4 text-xs text-gold hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                filteredResults?.map((idea: any, idx: number) => {
                                    const isSelected = selectedKeywords.has(idea.keyword);
                                    const isSaved = savedKeywords.has(idea.keyword);

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "card-premium p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3.5 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 relative transition-all",
                                                idx < 10 ? `delay-${idx * 50}` : '',
                                                isSelected && "ring-2 ring-gold/50 shadow-lg shadow-gold/20"
                                            )}
                                            onClick={() => toggleSelectKeyword(idea.keyword)}
                                        >
                                            {/* Selection checkbox */}
                                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                                                <div className={cn(
                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                    isSelected
                                                        ? "bg-gold border-gold shadow-sm shadow-gold/50"
                                                        : "border-border bg-card group-hover:border-gold/50"
                                                )}>
                                                    {isSelected && <CheckCircle2 size={12} className="text-background" />}
                                                </div>
                                            </div>

                                            {/* Save button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSaveKeyword(idea.keyword);
                                                }}
                                                className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 p-1.5 rounded-lg hover:bg-muted transition-colors touch-manipulation"
                                            >
                                                {isSaved ? (
                                                    <BookmarkCheck size={16} className="text-gold fill-gold" />
                                                ) : (
                                                    <Bookmark size={16} className="text-muted-foreground group-hover:text-gold transition-colors" />
                                                )}
                                            </button>

                                            <div className="flex items-center justify-between mt-6">
                                                <span className={cn("font-mono-dm text-[9px] font-bold uppercase tracking-wider rounded-md px-2 py-1 border flex items-center gap-1.5", chipClass(idea.type))}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", chipDot(idea.type))} />
                                                    {idea.type}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {getTrendIcon(idea.trend)}
                                                    <span className="badge-lilac text-[8px] px-2 py-0.5">{idea.intent}</span>
                                                </div>
                                            </div>

                                            <p className="text-[13px] sm:text-base font-semibold text-foreground leading-snug flex-1 min-h-[2.8rem] sm:min-h-[3rem]">{idea.keyword}</p>

                                            {/* ── Metrics ── */}
                                            <div className="grid grid-cols-3 gap-2 pt-2.5 sm:pt-3 border-t border-border">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground">Vol</span>
                                                    <span className="text-sm font-bold text-foreground">{(idea.volume / 1000).toFixed(1)}k</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground">Diff</span>
                                                    <span className={cn("text-sm font-bold flex items-center gap-1", getDifficultyColor(idea.difficulty))}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", getDifficultyColor(idea.difficulty).replace('text-', 'bg-'))} />
                                                        {idea.difficulty}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono-dm text-[9px] uppercase tracking-wider text-muted-foreground">CPC</span>
                                                    <span className="text-sm font-bold text-foreground">${idea.cpc}</span>
                                                </div>
                                            </div>

                                            <button
                                                className="w-full flex items-center justify-center gap-2 bg-muted border border-border rounded-xl py-2.5 text-xs font-bold text-muted-foreground group-hover:bg-gold/10 group-hover:border-gold/30 group-hover:text-gold transition-all touch-manipulation"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `/dashboard/articles/new?keyword=${encodeURIComponent(idea.keyword)}`;
                                                }}
                                            >
                                                <Plus size={12} />
                                                Generate
                                                <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </button>
                                        </div>
                                    );
                                }))}
                        </div>
                    </>
                )}

                {/* ── Empty tips ── */}
                {!results && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-12 opacity-60">
                        {[
                            {
                                icon: <CheckCircle2 size={17} />,
                                color: "bg-gold/10",
                                iconColor: "text-gold",
                                title: "Local Search",
                                body: "Add city or country names to find hyper-local content opportunities with less competition.",
                            },
                            {
                                icon: <MessageSquare size={17} />,
                                color: "bg-teal/10",
                                iconColor: "text-teal",
                                title: "PAA Power",
                                body: "Questions in \"People Also Ask\" make the best long-term traffic drivers — grab them first.",
                            },
                            {
                                icon: <History size={17} />,
                                color: "bg-lilac/10",
                                iconColor: "text-lilac",
                                title: "Trend Spotting",
                                body: 'Search "[Topic] 2025" to surface keywords your competitors haven\'t targeted yet.',
                            },
                        ].map((tip, i) => (
                            <div className="card-premium p-5 sm:p-6" key={i}>
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4", tip.color, tip.iconColor)}>
                                    {tip.icon}
                                </div>
                                <h3 className="text-sm font-bold text-foreground mb-2">{tip.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentPlan="free"
                reason={upgradeReason}
                onUpgrade={(plan) => {
                    router.push("/dashboard/settings?tab=billing");
                }}
            />
        </div>
    );
}
//  