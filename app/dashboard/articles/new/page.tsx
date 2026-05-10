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
import { motion, AnimatePresence } from "framer-motion";

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
  const [showKeywordHint, setShowKeywordHint] = useState(false);
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
        setShowKeywordHint(true);
        setTimeout(() => setShowKeywordHint(false), 2000);
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col aurora-bg noise-overlay">
      <ConfettiCelebration trigger={showConfetti} />
      <KeyboardShortcutsModal />

      {/* Sharp Sticky Header */}
      <div className="sticky top-0 z-[100] flex items-center gap-3 border-b border-white/5 px-4 sm:px-6 py-2 backdrop-blur-2xl bg-background/60">
        <motion.button
          whileHover={{ x: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-2.5 py-1.5 text-[10px] font-black text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shadow-sm uppercase tracking-widest"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </motion.button>
        <div className="h-5 w-[1px] bg-border/40" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <FilePlus2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xs font-black text-foreground uppercase tracking-tight leading-none">New Article</h1>
            <p className="text-[8px] text-primary/60 font-mono tracking-widest mt-0.5">AI POWERED</p>
          </div>
        </div>
        {lastSaved && (
          <div className="ml-auto flex items-center gap-1.5 text-[9px] font-black text-emerald-500/60 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 uppercase tracking-widest">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <span>Saved</span>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pt-3 relative z-10 hidden md:block">
        <GenerationStats />
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
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-8 pt-4 lg:pb-12 lg:pt-6 relative z-10 w-full max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 w-full items-start">
              
              {/* Left Column: hidden on mobile, visible on lg */}
              <div className="hidden lg:flex flex-col items-start text-left pt-8">
                <motion.div 
                  className="mb-5 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 shadow-lg shadow-primary/5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    AI Article Writer
                  </span>
                </motion.div>

                <h1 className="mb-5 max-w-xl text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[0.95] font-display">
                  Dominate the{" "}
                  <span className="bg-gradient-to-r from-primary via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                    SERPs
                  </span>
                </h1>
                
                <p className="mb-8 max-w-md text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                  Enter your target keyword and we'll generate a fully optimized, ready-to-rank article for your site.
                </p>

                <div className="w-full max-w-xs space-y-3">
                  {[
                    { label: "Research", time: "~30s", icon: BarChart3, color: "text-indigo-400", bg: "bg-indigo-400/10" },
                    { label: "Outline", time: "~45s", icon: FileText, color: "text-cyan-400", bg: "bg-cyan-400/10" },
                    { label: "Writing", time: "~2min", icon: PenTool, color: "text-rose-400", bg: "bg-rose-400/10" },
                    { label: "SEO Review", time: "~30s", icon: Zap, color: "text-emerald-400", bg: "bg-emerald-400/10" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5", item.bg)}>
                        <item.icon className={cn("h-4 w-4", item.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black tracking-widest text-foreground/80 uppercase leading-none">{item.label}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/40 uppercase mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile-only compact header */}
              <div className="lg:hidden flex items-center gap-3 mb-1">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-black text-foreground">Generate a new article</p>
              </div>

              {/* Right Column: Form */}
              <div className="flex flex-col items-center w-full lg:max-w-md lg:mx-0">
                <motion.div 
                  className="w-full rounded-xl border border-white/10 bg-card/40 backdrop-blur-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden"
                >
                  <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-1 mb-2">
                      <h2 className="text-sm font-black tracking-widest text-foreground uppercase">Article Details</h2>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-60">Fill in the details below</p>
                    </div>

                    {/* Keyword Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-0.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Target Keyword</label>
                        {keyword && (
                          <span className="text-[9px] font-mono font-bold text-primary/40 uppercase">{keyword.length} CH</span>
                        )}
                      </div>
                      <div className="group relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          autoFocus
                          placeholder="e.g. best hiking backpacks"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          className="h-11 pl-10 pr-10 text-sm border-white/5 bg-black/20 backdrop-blur-md focus-visible:border-primary/40 focus-visible:ring-primary/10 transition-all rounded-lg font-medium"
                        />
                        {keyword && (
                          <button
                            type="button"
                            onClick={() => setKeyword("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-white/5 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Site Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-0.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Destination</label>
                        <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">{sites.length} Active</span>
                      </div>
                      
                      {sitesLoading ? (
                        <div className="h-24 rounded-lg border border-white/5 bg-black/10 flex items-center justify-center animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin text-primary opacity-20" />
                        </div>
                      ) : sites.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/sites/new")}
                          className="w-full rounded-lg border border-dashed border-white/10 bg-black/10 p-6 text-center hover:border-primary/20 transition-all"
                        >
                          <Globe className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-[10px] font-black text-foreground uppercase tracking-wider">No Sites Link</p>
                        </button>
                      ) : (
                        <div className="grid gap-2">
                          {sites.map((site) => (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() => setSiteId(site.id)}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-300",
                                siteId === site.id
                                  ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/5"
                                  : "border-white/5 bg-black/20 text-muted-foreground hover:border-primary/20"
                              )}
                            >
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300",
                                siteId === site.id ? "bg-primary/20 border-primary/20 text-primary" : "bg-muted/5 border-white/5 opacity-40"
                              )}>
                                <Globe className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("truncate text-xs font-black tracking-tight uppercase", siteId === site.id ? "text-foreground" : "text-muted-foreground")}>
                                  {site.siteName}
                                </p>
                                <p className="truncate text-[8px] font-mono opacity-30 uppercase tracking-tighter mt-0.5">{site.domain}</p>
                              </div>
                              {siteId === site.id && (
                                <motion.div layoutId="active-indicator" className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Section */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting || !keyword.trim() || !siteId}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-lg py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                          !submitting && keyword.trim() && siteId
                            ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                            : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
                        )}
                      >
                        <span className="relative flex items-center justify-center gap-2">
                          <Zap className={cn("h-3.5 w-3.5", !submitting && keyword.trim() && siteId ? "fill-white" : "")} />
                          Generate Article
                        </span>
                      </button>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 flex items-start gap-2.5"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider leading-relaxed">{error}</p>
                          {error.includes('limit') && (
                            <button
                              type="button"
                              onClick={() => router.push('/dashboard/settings')}
                              className="mt-1 text-[9px] font-black text-rose-500 underline underline-offset-2 hover:no-underline uppercase"
                            >
                              Upgrade Plan
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </form>
                </motion.div>

                {/* Example keywords — desktop only */}
                <div className="hidden sm:block mt-6 w-full space-y-3">
                  <div className="flex items-center gap-2 px-1 opacity-20">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">Presets</p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-foreground" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXAMPLE_KEYWORDS.map((kw, index) => (
                      <motion.button
                        key={kw}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setKeyword(kw)}
                        className="group relative rounded-lg border border-white/5 bg-card/20 px-3 py-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest transition-all hover:border-primary/20 hover:text-foreground"
                      >
                        <span className="absolute -top-1 -left-1 hidden sm:flex h-4 w-4 items-center justify-center rounded-md bg-primary text-[8px] font-black text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {index + 1}
                        </span>
                        {kw}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
