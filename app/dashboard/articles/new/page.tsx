"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Globe, Search, Loader2, AlertCircle, Clock, X, BarChart3, FileText, PenTool, Zap } from "lucide-react";
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
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error("Authentication failed. Please refresh the page.");
        throw new Error("Unable to get ID token");
      }

      console.log("Auth token obtained, calling API...");
      setProgressMessage("Generating SEO brief...");

      const data = await generateWithProgress<BriefState>(
        "/api/articles/brief",
        { keyword: keyword.trim(), siteId },
        idToken,
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
      <div className="flex items-center gap-3 border-b border-border px-4 md:px-8 py-3 md:py-4 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-foreground">New Article</span>
        </div>
        {lastSaved && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">Draft saved</span>
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 pb-12 sm:pb-16 pt-8 sm:pt-10 relative z-10">
          {/* Badge */}
          <div className="mb-4 sm:mb-6 flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 sm:px-4 py-1.5 animate-float">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold">
              AI Content Generator
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-3 max-w-2xl text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display">
            What do you want{" "}
            <span className="gradient-gold-teal">
              to rank for?
            </span>
          </h1>
          <p className="mb-8 sm:mb-10 max-w-md text-center text-sm sm:text-base text-muted-foreground px-4">
            Enter your target keyword and we'll generate a fully optimised
            article — brief, outline, draft and SEO — in minutes.
          </p>

          {/* What happens next preview */}
          {!keyword && !siteId && (
            <div className="mb-8 w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm p-4 sm:p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  What happens next?
                </p>
                <div className="grid gap-2.5">
                  {[
                    { step: 1, label: "SEO Brief", time: "~30s", icon: BarChart3, color: "text-blue-500" },
                    { step: 2, label: "Article Outline", time: "~45s", icon: FileText, color: "text-green-500" },
                    { step: 3, label: "Full Draft", time: "~2min", icon: PenTool, color: "text-purple-500" },
                    { step: 4, label: "SEO Polish", time: "~30s", icon: Zap, color: "text-yellow-500" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3 text-xs">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="flex-1 text-muted-foreground">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground/70 text-center">
                    Total time: ~3-4 minutes • Fully editable at every step
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main form */}
          <div className="relative w-full max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Prevent double submission overlay */}
              {submitting && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto" />
                    <p className="text-xs text-muted-foreground">Processing your request...</p>
                  </div>
                </div>
              )}
            
            {/* Success indicator when form is complete */}
            {keyword.trim() && siteId && !submitting && (
              <div className="flex items-center justify-center gap-2 text-xs text-teal animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                <span>Ready to generate</span>
                <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              </div>
            )}
            {/* Keyword input */}
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-gold" />
              <Input
                autoFocus
                placeholder="e.g. best CRM software for small businesses"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={submitting}
                aria-label="Target keyword"
                className="h-12 sm:h-14 pl-10 sm:pl-11 pr-24 text-sm sm:text-base shadow-none border-border bg-card focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20 transition-all focus-premium"
              />
              {/* Character counter & clear button */}
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {keyword && (
                  <>
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      aria-label="Clear keyword"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-px bg-border" />
                  </>
                )}
                {keyword && (
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-mono transition-colors",
                      keyword.length >= 30 && keyword.length <= 100 ? "text-teal" : "text-muted-foreground"
                    )}>
                      {keyword.length}
                    </span>
                    {keyword.length >= 30 && keyword.length <= 100 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Keyword hint */}
            {keyword && keyword.length < 30 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 -mt-2 px-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-blue-500" />
                Tip: More specific keywords (30-100 chars) get better results
              </p>
            )}
            {showKeywordHint && (
              <p className="text-[10px] sm:text-xs text-gold -mt-2 px-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-gold" />
                Press 1-4 to quickly select example keywords
              </p>
            )}

            {/* Recent keywords */}
            {recentKeywords.length > 0 && !keyword && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Recent keywords
                  </label>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[10px] text-muted-foreground/60 hover:text-destructive transition-colors"
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
                      className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-gold/40 hover:bg-gold/5 hover:text-foreground hover:scale-105 active:scale-95"
                    >
                      <Clock className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="max-w-[200px] truncate">{kw}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Site selector */}
            {sitesLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading your sites…</span>
              </div>
            ) : sites.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="rounded-full bg-gold/10 p-3">
                    <Globe className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">No sites configured yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add your first site to start generating content
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 font-medium transition-colors"
                  onClick={() => router.push("/dashboard/sites/new")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Create your first site →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Select a site
                  <span className="ml-auto text-[10px] text-muted-foreground/60">
                    {sites.length} {sites.length === 1 ? 'site' : 'sites'} available
                  </span>
                </label>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Select site">
                  {sites.map((site, index) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setSiteId(site.id)}
                      role="radio"
                      aria-checked={siteId === site.id}
                      aria-label={`Select ${site.siteName}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
                        siteId === site.id
                          ? "border-gold/60 bg-gold/10 text-foreground shadow-sm shadow-gold/10 ring-2 ring-gold/20"
                          : "border-border bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground hover:shadow-sm"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md",
                          siteId === site.id
                            ? "bg-gold/20 text-gold"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs sm:text-sm font-medium leading-tight">
                          {site.siteName}
                        </p>
                        <p className="truncate text-[10px] sm:text-xs opacity-60">{site.domain}</p>
                      </div>
                      {siteId === site.id && (
                        <div className="ml-auto h-2 w-2 shrink-0 rounded-full bg-gold animate-pulse-glow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 sm:px-4 py-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-destructive">{error}</p>
                    {error.includes('timeout') || error.includes('Retry') ? (
                      <p className="text-[10px] sm:text-xs text-destructive/70 mt-1">
                        The request is taking longer than expected. Please try again.
                      </p>
                    ) : error.includes('limit') ? (
                      <p className="text-[10px] sm:text-xs text-destructive/70 mt-1">
                        <button
                          type="button"
                          onClick={() => router.push('/dashboard/settings')}
                          className="underline hover:no-underline font-medium"
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
            <button
              type="submit"
              disabled={submitting || !keyword.trim() || !siteId}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl py-3 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all duration-200 btn-gold",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                !submitting && keyword.trim() && siteId && "hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gold/20",
                submitting && "pointer-events-none"
              )}
            >
              {/* Animated gradient overlay */}
              {!submitting && keyword.trim() && siteId && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}

              {submitting ? (
                <span className="flex flex-col items-center justify-center gap-1.5">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Generating your SEO brief…</span>
                    <span className="sm:hidden">Generating…</span>
                  </span>
                  {progressMessage && (
                    <span className="text-[10px] sm:text-xs text-white/70">{progressMessage}</span>
                  )}
                  <span className="text-[9px] text-white/50 mt-1">Please wait, do not refresh</span>
                </span>
              ) : (
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Generate Brief
                  {keyword.trim() && siteId && (
                    <span className="hidden sm:inline text-xs opacity-70">→</span>
                  )}
                </span>
              )}
            </button>
            </form>
          </div>

          {/* Example keywords */}
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
              Try an example
              <span className="hidden sm:inline text-[9px] opacity-60">(or press 1-4)</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {EXAMPLE_KEYWORDS.map((kw, index) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setKeyword(kw)}
                  className="group relative rounded-full border border-border bg-card px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-muted-foreground transition-all hover:border-gold/40 hover:bg-gold/5 hover:text-foreground hover:scale-105 active:scale-95"
                >
                  <span className="absolute -top-1 -left-1 hidden sm:flex h-4 w-4 items-center justify-center rounded-full bg-gold/20 text-[8px] font-bold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1}
                  </span>
                  {kw}
                </button>
              ))}
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
