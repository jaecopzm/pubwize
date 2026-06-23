"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FilePlus2, Globe, Search, Loader2, AlertCircle, X, Zap } from "lucide-react";
import { useSites } from "@/lib/hooks/use-sites";
import { cn } from "@/lib/utils";
import type { BriefData } from "@/lib/types";
import { toast } from "sonner";
import { generateWithProgress, validateGenerationInput, GenerationError } from "@/lib/generation-utils";
import { GenerationLoader } from "@/components/generation-loader";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { ConfettiCelebration } from "@/components/confetti-celebration";
import { useRecentKeywords } from "@/lib/hooks/use-recent-keywords";
import { useFormAutosave } from "@/lib/hooks/use-form-autosave";
import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
        </div>
      </div>
    }>
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { sites, loading: sitesLoading } = useSites();
  const { recentKeywords, addKeyword, clearRecent } = useRecentKeywords();
  const { formState, updateForm, clearSaved, lastSaved } = useFormAutosave();
  const { plan } = useUserPlan();

  useEffect(() => {
    if (formState.keyword && !keyword) setKeyword(formState.keyword);
    if (formState.siteId && !siteId) setSiteId(formState.siteId);
  }, [formState]);

  useEffect(() => {
    updateForm({ keyword, siteId });
  }, [keyword, siteId, updateForm]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (submitting || e.target instanceof HTMLInputElement) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= EXAMPLE_KEYWORDS.length) {
        setKeyword(EXAMPLE_KEYWORDS[num - 1]);
      }
      if (e.key === "Escape" && keyword) setKeyword("");
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
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setProgressMessage("");
    const validationError = validateGenerationInput(keyword, siteId);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setSubmitting(false);
      return;
    }
    try {
      setProgressMessage("Getting started...");
      const data = await generateWithProgress<BriefState>(
        "/api/articles/brief",
        { keyword: keyword.trim(), siteId },
        "",
        { maxRetries: 1, timeout: 90000, onProgress: (msg) => setProgressMessage(msg) }
      );
      if (!data.articleId) throw new Error("No article ID returned");
      trackEvent("article_created", {
        source: "new_article_page",
        site_id: siteId,
        plan,
        keyword_length: keyword.trim().length,
      });
      addKeyword(keyword.trim());
      clearSaved();
      setShowConfetti(true);
      setTimeout(() => router.push(`/dashboard/articles/${data.articleId}`), 1200);
    } catch (err) {
      if (err instanceof GenerationError) {
        setError(err.message);
        if (err.isLimitError) setShowUpgradeModal(true);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
      setProgressMessage("");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <ConfettiCelebration trigger={showConfetti} />
      <KeyboardShortcutsModal />

      {/* Sticky Header */}
      <div className="sticky top-0 z-[100] flex items-center gap-3 border-b border-border px-4 sm:px-6 py-2 bg-card/80 backdrop-blur-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <FilePlus2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">New Article</span>
        </div>
        {lastSaved && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Saved</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {submitting ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <GenerationLoader step="brief" message={progressMessage || "Getting started..."} />
          </motion.div>
        ) : (
          <div
            key="content"
            className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-8 pt-6 lg:pb-12 w-full max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 w-full items-start">
              
              {/* Left Column — desktop only */}
              <div className="hidden lg:flex flex-col pt-8">
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                  Create a New Article
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-10">
                  Enter a target keyword, pick a site, and we'll generate an SEO-optimized article ready to publish.
                </p>

                {recentKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Recent Keywords
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setKeyword(kw)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile header */}
              <div className="lg:hidden mb-2">
                <h1 className="text-xl font-bold text-foreground">New Article</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter a keyword and pick a site to get started.</p>
              </div>

              {/* Right Column — Form */}
              <div className="w-full lg:max-w-md">
                <div className="w-full rounded-xl border border-border bg-card p-5 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Keyword */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Target Keyword</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          autoFocus
                          placeholder="e.g. best hiking backpacks"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          className="h-10 pl-9 pr-9 text-sm"
                        />
                        {keyword && (
                          <button
                            type="button"
                            onClick={() => setKeyword("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Site */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Destination Site</label>
                      
                      {sitesLoading ? (
                        <div className="h-20 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : sites.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/sites/new")}
                          className="w-full rounded-lg border border-dashed border-border p-5 text-center hover:bg-muted/30 transition-colors"
                        >
                          <Globe className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs font-medium text-muted-foreground">No sites yet — create one</p>
                        </button>
                      ) : (
                        <div className="grid gap-1.5">
                          {sites.map((site) => (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() => setSiteId(site.id)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                                siteId === site.id
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                              )}
                            >
                              <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                                siteId === site.id ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"
                              )}>
                                <Globe className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("truncate text-sm font-medium", siteId === site.id ? "text-foreground" : "")}>
                                  {site.siteName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">{site.domain}</p>
                              </div>
                              {siteId === site.id && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting || !keyword.trim() || !siteId}
                      className={cn(
                        "w-full rounded-lg py-2.5 text-sm font-semibold transition-all",
                        !submitting && keyword.trim() && siteId
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        {submitting ? "Generating..." : "Generate Article"}
                      </span>
                    </button>

                    {error && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-destructive">{error}</p>
                          {error.includes('limit') && (
                            <button
                              type="button"
                              onClick={() => router.push('/dashboard/settings')}
                              className="mt-1 text-xs font-medium text-destructive underline hover:no-underline"
                            >
                              Upgrade Plan
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Example keywords */}
                <div className="hidden sm:block mt-5">
                  <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_KEYWORDS.map((kw, index) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setKeyword(kw)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
        reason={error || undefined}
        onUpgrade={() => router.push('/dashboard/settings?tab=billing')}
      />
    </div>
  );
}
