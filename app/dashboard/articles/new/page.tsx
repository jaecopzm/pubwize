"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FilePlus2, Sparkles, Globe, Search, Loader2, AlertCircle, Clock, X, BarChart3, FileText, PenTool, Zap } from "lucide-react";
import { useSites } from "@/lib/hooks/use-sites";
import { cn } from "@/lib/utils";
import type { BriefData } from "@/lib/types";
import { toast } from "sonner";
import { generateWithProgress, validateGenerationInput, GenerationError } from "@/lib/generation-utils";
import { GenerationStats } from "@/components/generation-stats";
import { GenerationLoader } from "@/components/generation-loader";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { ConfettiCelebration } from "@/components/confetti-celebration";
import { useRecentKeywords } from "@/lib/hooks/use-recent-keywords";
import { useFormAutosave } from "@/lib/hooks/use-form-autosave";
import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";

interface BriefState {
  articleId: string;
  brief: BriefData;
  intent: string;
  articleType: string;
}

const EXAMPLE_KEYWORDS = [
  "best hiking backpacks for women",
  "how to start a podcast in 2025",
  "remote work productivity tips",
  "plant-based diet beginner guide",
];

export default function NewArticlePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NewArticleContent />
    </Suspense>
  );
}

function NewArticleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [siteId, setSiteId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [showKeywordHint, setShowKeywordHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { sites, loading: sitesLoading } = useSites();
  const { recentKeywords, addKeyword, clearRecent } = useRecentKeywords();
  const { formState, updateForm, clearSaved, lastSaved } = useFormAutosave();
  const { plan } = useUserPlan();

  // Load autosaved form state
  useEffect(() => {
    if (formState.keyword && !keyword) {
      setKeyword(formState.keyword);
    }
    if (formState.siteId && !siteId) {
      setSiteId(formState.siteId);
    }
  }, [formState]);

  // Update autosave when form changes
  useEffect(() => {
    updateForm({ keyword, siteId });
  }, [keyword, siteId, updateForm]);

  // Show autosave notification
  useEffect(() => {
    if (lastSaved && (keyword || siteId)) {
      const timeSinceLastSave = Date.now() - lastSaved.getTime();
      // Only show if it was just saved (within 2 seconds)
      if (timeSinceLastSave < 2000) {
        // Silent autosave - no toast needed, just the indicator in header
      }
    }
  }, [lastSaved, keyword, siteId]);

  // Keyboard shortcut for example keywords
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (submitting || e.target instanceof HTMLInputElement) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= EXAMPLE_KEYWORDS.length) {
        setKeyword(EXAMPLE_KEYWORDS[num - 1]);
        setShowKeywordHint(true);
        setTimeout(() => setShowKeywordHint(false), 2000);
      }

      // Escape to clear
      if (e.key === "Escape" && keyword) {
        setKeyword("");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [submitting, keyword]);

  useEffect(() => {
    const kw = searchParams.get("keyword");
    const sid = searchParams.get("siteId");
    if (kw) setKeyword(kw);
    if (sid) setSiteId(sid);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) {
      console.log("Form already submitting, ignoring duplicate submission");
      return;
    }
    
    setError(null);
    setProgressMessage("");

    // Validate input
    const validationError = validateGenerationInput(keyword, siteId);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    console.log("Starting brief generation for:", { keyword: keyword.trim(), siteId });

    try {
      setSubmitting(true);
      console.log("Auth token obtained, calling API...");
      setProgressMessage("Generating SEO brief...");

      const data = await generateWithProgress<BriefState>(
        "/api/articles/brief",
        { keyword: keyword.trim(), siteId },
        "",
        {
          maxRetries: 1,
          timeout: 90000, // 90 seconds for brief generation
          onProgress: (msg) => {
            console.log("Progress:", msg);
            setProgressMessage(msg);
          },
        }
      );

      console.log("Brief generated successfully:", data);

      if (!data.articleId) {
        throw new Error("No article ID returned from server");
      }

      // Add to recent keywords
      addKeyword(keyword.trim());

      // Clear autosaved form
      clearSaved();

      // Show confetti
      setShowConfetti(true);

      toast.success("SEO brief generated! Redirecting...");

      // Redirect after confetti
      setTimeout(() => {
        router.push(`/dashboard/articles/${data.articleId}`);
      }, 1000);

    } catch (err) {
      console.error("Brief generation error:", err);
      if (err instanceof GenerationError) {
        setError(err.message);
        toast.error(err.message);
        
        // Show upgrade modal if it's a limit error
        if (err.isLimitError) {
          setShowUpgradeModal(true);
        }
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Something went wrong. Please try again.");
        toast.error("Something went wrong");
      }
    } finally {
      setSubmitting(false);
      setProgressMessage("");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col aurora-bg noise-overlay">
      {/* Confetti celebration */}
      <ConfettiCelebration trigger={showConfetti} />

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal />

      {/* Back nav */}
      <div className="flex items-center gap-2 border-b border-border px-3 sm:px-6 md:px-8 py-2.5 md:py-3 backdrop-blur-md bg-background/90 sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline font-medium">Back</span>
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6366f1]/15">
            <FilePlus2 className="h-3.5 w-3.5 text-[#818cf8]" />
          </div>
          <span className="text-sm font-semibold text-foreground">New Article</span>
        </div>
        {lastSaved && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 relative z-10">
        <GenerationStats />
      </div>

      {/* Loading State */}
      {submitting && (
        <div className="flex-1">
          <GenerationLoader step="brief" message={progressMessage || "Generating SEO Brief..."} />
        </div>
      )}

      {/* Hero area */}
      {!submitting && (
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-12 sm:pb-16 pt-8 sm:pt-10 relative z-10 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 w-full items-center">
            
            {/* Left Column: Copy & Value Prop */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Badge */}
              <div className="mb-4 sm:mb-6 flex items-center gap-2 rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-3 sm:px-4 py-1.5 animate-float shadow-lg shadow-[#6366f1]/5">
                <Sparkles className="h-3.5 w-3.5 text-[#818cf8]" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#818cf8]">
                  AI Content Generator
                </span>
              </div>

              {/* Headline */}
              <h1 className="mb-4 max-w-2xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground font-display leading-[1.1]">
                What do you want{" "}
                <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#22d3ee] bg-clip-text text-transparent drop-shadow-sm">
                  to rank for?
                </span>
              </h1>
              <p className="mb-8 max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
                Enter your target keyword and we'll generate a fully optimised
                article — brief, outline, draft and SEO — in minutes.
              </p>

              {/* What happens next preview (Desktop) */}
              {!keyword && !siteId && (
                <div className="hidden lg:block w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="rounded-2xl border border-white/5 bg-card/30 backdrop-blur-md p-6 shadow-2xl hover:border-white/10 transition-all card-premium">
                    <p className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4 text-[#818cf8]" />
                      What happens next?
                    </p>
                    <div className="space-y-4">
                      {[
                        { step: 1, label: "SEO Brief", time: "~30s", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { step: 2, label: "Article Outline", time: "~45s", icon: FileText, color: "text-green-500", bg: "bg-green-500/10" },
                        { step: 3, label: "Full Draft", time: "~2min", icon: PenTool, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { step: 4, label: "SEO Polish", time: "~30s", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" }
                      ].map((item, idx) => (
                        <div key={item.step} className="relative flex items-center gap-4">
                          {idx !== 3 && <div className="absolute left-4 top-8 h-6 w-px bg-border/50" />}
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", item.bg)}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 px-2 py-1 rounded-md">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Form */}
            <div className="flex flex-col items-center w-full max-w-xl mx-auto lg:mx-0">
              
              {/* Mobile "What happens next" (only shows when no keyword/siteId and screen is small) */}
              {!keyword && !siteId && (
                <div className="lg:hidden mb-8 w-full animate-in fade-in slide-in-from-bottom-3 duration-700">
                  <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm p-4 sm:p-5 shadow-xl hover:border-white/10 transition-all">
                    <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-[#818cf8]" />
                      What happens next?
                    </p>
                    <div className="grid gap-2.5">
                      {[
                        { step: 1, label: "SEO Brief", time: "~30s", icon: BarChart3, color: "text-blue-500" },
                        { step: 2, label: "Article Outline", time: "~45s", icon: FileText, color: "text-green-500" },
                        { step: 3, label: "Full Draft", time: "~2min", icon: PenTool, color: "text-purple-500" },
                        { step: 4, label: "SEO Polish", time: "~30s", icon: Zap, color: "text-amber-500" }
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-3 text-xs">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="flex-1 text-muted-foreground">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative w-full">
                <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                  {/* Prevent double submission overlay */}
                  {submitting && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#818cf8] mx-auto" />
                        <p className="text-xs text-muted-foreground">Processing your request...</p>
                      </div>
                    </div>
                  )}
                
                {/* Success indicator when form is complete */}
                {keyword.trim() && siteId && !submitting && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-[#10b981] animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="font-semibold">Ready to generate</span>
                  </div>
                )}
                {/* Keyword input */}
                <div className="group relative">
                  <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#818cf8]" />
                  <Input
                    autoFocus
                    placeholder="e.g. best CRM software for small businesses"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={submitting}
                    aria-label="Target keyword"
                    className="h-11 sm:h-12 pl-10 sm:pl-11 pr-20 text-sm sm:text-base shadow-md border-border/50 bg-card/80 backdrop-blur-sm focus-visible:border-[#6366f1] focus-visible:ring-2 focus-visible:ring-[#6366f1]/20 transition-all rounded-xl"
                  />
                  {/* Character counter & clear button */}
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {keyword && (
                      <>
                        <button
                          type="button"
                          onClick={() => setKeyword("")}
                          className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                          aria-label="Clear keyword"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="h-5 w-px bg-border" />
                      </>
                    )}
                    {keyword && (
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-mono font-medium transition-colors",
                          keyword.length >= 30 && keyword.length <= 100 ? "text-[#10b981]" : "text-muted-foreground"
                        )}>
                          {keyword.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Keyword hint */}
                {keyword && keyword.length < 30 && (
                  <p className="text-xs text-muted-foreground/70 -mt-3 px-1 animate-in fade-in slide-in-from-top-1 flex items-center justify-center lg:justify-start gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-[#22d3ee]" />
                    More specific keywords get better results
                  </p>
                )}
                {showKeywordHint && (
                  <p className="text-xs text-[#818cf8] -mt-3 px-1 animate-in fade-in slide-in-from-top-1 flex items-center justify-center lg:justify-start gap-1.5 font-medium">
                    <Zap className="h-3.5 w-3.5 text-[#818cf8]" />
                    Press 1-4 to quickly select example keywords
                  </p>
                )}

                {/* Recent keywords */}
                {recentKeywords.length > 0 && !keyword && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 bg-card/40 backdrop-blur-sm p-3 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Recent Searches
                      </label>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-destructive transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentKeywords.map((kw, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setKeyword(kw)}
                          className="group flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-[#6366f1]/40 hover:bg-[#6366f1]/5 hover:text-foreground hover:scale-105 active:scale-95 shadow-sm"
                        >
                          <Clock className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="max-w-[200px] truncate font-medium">{kw}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Site selector */}
                {sitesLoading ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Loading your sites…</span>
                  </div>
                ) : sites.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-6 text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="rounded-xl bg-[#6366f1]/10 p-3">
                        <Globe className="h-6 w-6 text-[#818cf8]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">No sites configured yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Add your first WordPress site to start generating content
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#6366f1] hover:bg-[#818cf8] px-4 py-2 rounded-lg transition-all shadow-md shadow-[#6366f1]/20 hover:scale-105 active:scale-95"
                      onClick={() => router.push("/dashboard/sites/new")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Connect Site
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      Select Target Site
                      <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">
                        {sites.length} available
                      </span>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Select site">
                      {sites.map((site, index) => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => setSiteId(site.id)}
                          role="radio"
                          aria-checked={siteId === site.id}
                          aria-label={`Select ${site.siteName}`}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                            siteId === site.id
                              ? "border-[#6366f1]/60 bg-[#6366f1]/10 text-foreground shadow-md shadow-[#6366f1]/10 ring-1 ring-[#6366f1]/20"
                              : "border-border/50 bg-card/80 backdrop-blur-sm text-muted-foreground hover:border-[#6366f1]/30 hover:text-foreground hover:shadow-sm hover:bg-card"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                              siteId === site.id
                                ? "bg-[#6366f1]/20 text-[#818cf8]"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                          <Globe className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm sm:text-base font-bold leading-tight">
                              {site.siteName}
                            </p>
                            <p className="truncate text-xs opacity-60 font-mono mt-0.5">{site.domain}</p>
                          </div>
                          {siteId === site.id && (
                            <div className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-destructive">{error}</p>
                        {error.includes('timeout') || error.includes('Retry') ? (
                          <p className="text-xs text-destructive/80 mt-1 font-medium">
                            The request is taking longer than expected. Please try again.
                          </p>
                        ) : error.includes('limit') ? (
                          <p className="text-xs text-destructive/80 mt-1 font-medium">
                            <button
                              type="button"
                              onClick={() => router.push('/dashboard/settings')}
                              className="underline hover:no-underline font-bold text-destructive"
                            >
                              Upgrade your plan
                            </button>
                            {' '}to generate more articles.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !keyword.trim() || !siteId}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-[#6366f1] to-[#818cf8]",
                      "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                      !submitting && keyword.trim() && siteId && "hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[#6366f1]/25 hover:shadow-[#6366f1]/40",
                      submitting && "pointer-events-none"
                    )}
                  >
                    {!submitting && keyword.trim() && siteId && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    )}
                    {submitting ? (
                      <span className="flex flex-col items-center justify-center gap-1.5">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating Brief…</span>
                        </span>
                        {progressMessage && (
                          <span className="text-xs text-white/70 font-normal">{progressMessage}</span>
                        )}
                      </span>
                    ) : (
                      <span className="relative flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                        Generate Article
                        {keyword.trim() && siteId && (
                          <span className="text-xs opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                        )}
                      </span>
                    )}
                  </button>
                </div>
                </form>
              </div>

              {/* Example keywords */}
              <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 w-full">
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                  Try an example
                  <span className="hidden sm:inline text-[9px] opacity-60 normal-case font-normal">(or press 1-4)</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_KEYWORDS.map((kw, index) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setKeyword(kw)}
                      className="group relative rounded-lg border border-border bg-card/50 backdrop-blur-sm px-3 py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-[#6366f1]/40 hover:bg-[#6366f1]/5 hover:text-foreground hover:scale-105 active:scale-95 hover:shadow-sm"
                    >
                      <span className="absolute -top-1 -left-1 hidden sm:flex h-4 w-4 items-center justify-center rounded-full bg-[#6366f1] text-[8px] font-bold text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-200">
                        {index + 1}
                      </span>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
        reason={error || undefined}
        onUpgrade={(plan) => router.push('/dashboard/settings?tab=billing')}
      />
    </div>
  );
}
