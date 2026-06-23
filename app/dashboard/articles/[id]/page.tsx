"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, FileText, List, PenLine, Copy, Check, Code, ChevronRight, Globe, Lock, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArticleHeader } from "@/components/article-editor/article-header";
import { useDraftGeneration } from "@/components/article-editor/use-draft-generation";
import { useApiCalls } from "@/components/article-editor/use-api-calls";
import { WordPressPublishPanel } from "@/components/wordpress";
import { ExportDialog } from "@/components/export";
import { ContentEditor } from "@/components/content-editor";
import { useSidebar } from "@/components/ui/sidebar";
import { BriefPanel } from "@/components/article-editor/brief-panel";
import { OutlinePanel } from "@/components/article-editor/outline-panel";
import { DraftPanel } from "@/components/article-editor/draft-panel";

import { StatPill, CopyButton } from "@/components/article-editor/shared-ui";

import { UnsplashSearch } from "@/components/unsplash-search";
import { AIImprovePanel } from "@/components/article-editor/ai-improve-panel";
import { SERPPreviewCard, SERPMetaEditor } from "@/components/serp-preview";
import { SectionRegenerate } from "@/components/article-editor/section-regenerate";
import { GenerationProgress } from "@/components/article-editor/generation-progress";
import { AutoPilotOverlay } from "@/components/article-editor/auto-pilot-overlay";
import { CommandRail } from "@/components/article-editor/command-rail";
import { useTypewriter } from "@/components/article-editor/use-typewriter";
import { SuccessCelebration } from "@/components/article-editor/success-celebration";

import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { calculateReadabilityScores, detectReadabilityIssues } from "@/lib/readability";
import { calculateSEOScore } from "@/lib/seo-scoring";
import { getAuthHeaders } from "@/lib/hooks/use-auth";
import type { BriefData, OutlineData, DraftData, OptimizationData, SocialMediaData, WordPressSite, ReadabilityScores, ReadabilityIssue } from "@/lib/types";
import { useIsAdmin } from "@/lib/hooks/use-is-admin";
import { toast } from "sonner";

interface ArticleState {
  articleId: string;
  keyword: string;
  intent: string;
  articleType: string;
  siteId: string;
  siteDomain?: string;
  featuredImage?: { url: string; photographer?: string; photographerUrl?: string; unsplashId?: string } | null;
  brief: BriefData | null;
  outline: OutlineData | null;
  draft: DraftData | null;
  optimization: OptimizationData | null;
  socialMedia: SocialMediaData | null;
  settings?: {
    targetWordCount?: number | null;
    tone?: string;
  };
}

// ── Stepper config ──────────────────────────────────────────────────
const STEPS = [
  { id: 1, key: "brief", label: "SEO Brief", icon: FileText, description: "Keyword research & content map" },
  { id: 2, key: "outline", label: "Outline", icon: List, description: "Structure your article" },
  { id: 3, key: "draft", label: "Draft & Optimize", icon: PenLine, description: "Full article with SEO scoring" },
] as const;

function getActiveStep(article: ArticleState): number {
  if (!article.outline) return 1;
  if (!article.draft) return 2;
  return 3;
}


// ── StepHeader Helper ───────────────────────────────────────────────
function StepHeader({ 
  number, 
  label, 
  description, 
  icon: Icon, 
  status, 
  isExpanded, 
  onToggle 
}: { 
  number: number; 
  label: string; 
  description: string; 
  icon: any; 
  status: "completed" | "active" | "locked"; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) {
  return (
    <button
      onClick={status === "locked" ? undefined : onToggle}
      disabled={status === "locked"}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-xl border p-4 transition-all text-left relative overflow-hidden",
        status === "locked" && "opacity-45 bg-muted/20 border-border/40 cursor-not-allowed",
        status === "active" && "bg-card border-primary/40 shadow-sm",
        status === "completed" && "bg-card hover:bg-accent/40 border-border/80"
      )}
    >
      {/* Active step indicator strip */}
      {status === "active" && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          number === 1 ? "bg-cyan-500" :
          number === 2 ? "bg-indigo-500" :
          number === 3 ? "bg-violet-500" : "bg-teal-500"
        )} />
      )}

      <div className="flex items-center gap-3.5 min-w-0">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-300",
          status === "completed" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
          status === "active" && (
            number === 1 ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-500" :
            number === 2 ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500" :
            number === 3 ? "bg-violet-500/10 border-violet-500/30 text-violet-500" :
            "bg-teal-500/10 border-teal-500/30 text-teal-500"
          ),
          status === "locked" && "bg-muted border-border/30 text-muted-foreground/50"
        )}>
          {status === "completed" ? (
            <Check className="h-4.5 w-4.5 font-bold" />
          ) : status === "locked" ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Icon className="h-4.5 w-4.5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-wider text-muted-foreground/60 uppercase">Step {number}</span>
            {status === "active" && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <h4 className="text-sm font-bold text-foreground mt-0.5 leading-tight">{label}</h4>
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 mt-0.5 font-medium truncate">{description}</p>
        </div>
      </div>

      {status !== "locked" && (
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground/60 transition-transform duration-200 shrink-0", isExpanded && "rotate-90")} />
      )}
    </button>
  );
}

// ── FocusTrap Helper ────────────────────────────────────────────────
function FocusTrap({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Publish to WordPress"
    >
      {children}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<ArticleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loader, setLoader] = useState(false);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [optLoading, setOptLoading] = useState(false);
  const [currentView, setCurrentView] = useState<number>(1); // Track which step to show
  const [error, setError] = useState<string | null>(null);
  const [zenMode, setZenMode] = useState(false);
  const { setOpen, setOpenMobile } = useSidebar();
  const draftContentRef = useRef("");
  const autoPilotAbortRef = useRef<AbortController | null>(null);
  const draftDirtyRef = useRef(false);

  const toggleZenMode = () => {
    const nextState = !zenMode;
    setZenMode(nextState);
    setOpen(!nextState);
    setOpenMobile(false);
    
    // Smooth scroll to top when entering Zen mode
    if (nextState) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-Pilot state
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoPilotRunning, setAutoPilotRunning] = useState(false);
  const [autoPilotPhase, setAutoPilotPhase] = useState<'brief' | 'outline' | 'draft' | 'seo' | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [genDuration, setGenDuration] = useState("");

  const { isAdmin, isLoaded: adminLoaded } = useIsAdmin();

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Premium features state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [readabilityScores, setReadabilityScores] = useState<ReadabilityScores | null>(null);
  const [readabilityIssues, setReadabilityIssues] = useState<ReadabilityIssue[]>([]);
  const [showWordPressPublish, setShowWordPressPublish] = useState(false);

  // Publish to Blog dialog state
  const [showBlogPublish, setShowBlogPublish] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [blogTagsInput, setBlogTagsInput] = useState("");
  const [blogPublishing, setBlogPublishing] = useState(false);
  const [blogPublished, setBlogPublished] = useState(false);
  const [blogPublishedUrl, setBlogPublishedUrl] = useState("");

  // Auto-derive slug from title
  useEffect(() => {
    setBlogSlug(blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }, [blogTitle]);
  
  // New premium UI state
  const [draftAccumulated, setDraftAccumulated] = useState("");
  const typewriterDraft = useTypewriter(draftAccumulated, 8);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });
  const [wordCount, setWordCount] = useState(0);

  // Fallback: extract meta description from article content if not provided by optimization
  const extractedDescription = useMemo(() => {
    if (!article) return "";
    if (article.draft?.content) {
      const stripped = article.draft.content
        .replace(/<[^>]+>/g, "")
        .replace(/\n+/g, " ")
        .trim();
      return stripped.slice(0, 160) + (stripped.length > 160 ? "…" : "");
    }
    return "";
  }, [article?.draft?.content]);

  // Custom hooks for API calls and draft generation
  const { handleGenerateOutline, handleOptimize } = useApiCalls({
    articleId,
    setLoader,
    setOutlineLoading,
    setOptLoading,
    setArticle,
    setError,
  });

  const { handleGenerateDraft } = useDraftGeneration({
    articleId,
    draftContentRef,
    setDraftLoading,
    setError,
    setDraftAccumulated,
    setWordCount,
    setArticle,
    setCurrentView,
  });

  // Derive progress for current phase
  const phaseProgress = useMemo(() => {
    if (!autoPilotRunning) return 0;
    if (autoPilotPhase === 'brief') return 45;
    if (autoPilotPhase === 'outline') return 65;
    if (autoPilotPhase === 'draft') {
      const target = article?.settings?.targetWordCount || 2000;
      return Math.min(65 + (wordCount / target) * 30, 95);
    }
    if (autoPilotPhase === 'seo') return 98;
    return 0;
  }, [autoPilotRunning, autoPilotPhase, wordCount, article?.settings?.targetWordCount]);

  const [fetchErrorCode, setFetchErrorCode] = useState<string | null>(null);
  const [fetchErrorRetryAfter, setFetchErrorRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/articles/${articleId}`, { headers });

        if (res.ok) {
          const { article: data } = await res.json();
          console.log("Article data loaded:", data);
          const optimizations = data.optimizations || null;
          setArticle({
            articleId: data.id,
            keyword: data.keyword,
            intent: data.intent,
            articleType: data.articleType,
            siteId: data.siteId,
            siteDomain: data.siteDomain,
            featuredImage: data.featuredImage || null,
            brief: data.brief || null,
            outline: data.outline || null,
            draft: data.draft || null,
            optimization: optimizations,
            socialMedia: optimizations?.socialMedia || null,
            settings: data.settings,
          });
        } else {
          const errorBody = await res.json().catch(() => ({}));
          const code = errorBody.code || '';
          const message = errorBody.error || `Request failed (${res.status})`;

          setError(message);
          setFetchErrorCode(code);

          if (res.status === 429) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10);
            setFetchErrorRetryAfter(retryAfter);
          }
        }
      } catch (err) {
        setError('Network error — please check your connection and try again.');
        console.error("Error fetching article:", err);
      }
      finally { setLoading(false); }
    };
    fetchArticle();
    
    // Track view (only once per session)
    const trackView = async () => {
      try {
        const headers = await getAuthHeaders();

        await fetch('/api/articles/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({ articleId }),
        });
      } catch (error) {
        // Silent fail - view tracking is not critical
      }
    };
    
    trackView();
  }, [articleId]);

  useEffect(() => {
    return () => { autoPilotAbortRef.current?.abort(); };
  }, []);

  // Warn on unsaved changes before page reload/close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draftDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Fetch WordPress sites (only once — cached in state, avoid re-fetch)
  const wpSitesFetchedRef = useRef(false);
  useEffect(() => {
    if (wpSitesFetchedRef.current) return;
    wpSitesFetchedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/wordpress/sites", { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setWordPressSites(data.sites || []);
      } catch {
        // Silent fail: modal will show "no sites" state
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Update currentView when article loads
  useEffect(() => {
    if (article) {
      const activeStep = getActiveStep(article);
      setCurrentView(activeStep);
      // Auto-expand the active step
      setExpandedSteps(prev => ({ ...prev, [activeStep]: true }));
      
      // Update word count if draft exists
      if (article.draft?.content) {
        setWordCount(article.draft.content.trim().split(/\s+/).length);
      }
    }
  }, [article]);

  // Auto-Pilot ETA Timer
  useEffect(() => {
    if (!autoPilotRunning || etaSeconds === null || etaSeconds <= 0) return;
    const interval = setInterval(() => {
      setEtaSeconds((prev) => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoPilotRunning, etaSeconds]);

  const handleAutoPilot = async () => {
    if (autoPilotRunning || !article) return;
    setAutoPilotRunning(true);
    setAutoPilotPhase('brief');
    setThinkingText("");
    setDraftAccumulated("");
    setWordCount(0);
    setEtaSeconds(180); // Start with 3 minutes
    setGenStartTime(Date.now());
    setError(null);
    autoPilotAbortRef.current?.abort();
    autoPilotAbortRef.current = new AbortController();

    try {

      const res = await fetch('/api/articles/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
        signal: autoPilotAbortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Auto-Pilot failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let draftAccumulated = '';
      let accumulatedRaw = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedRaw += decoder.decode(value, { stream: true });
        const lines = accumulatedRaw.split('\n');
        accumulatedRaw = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;

          const dataStr = trimmedLine.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) throw new Error(payload.error);

            // Phase announcements — reset thinking text
            if (payload.phase) {
              setAutoPilotPhase(payload.phase);
              setThinkingText("");
              if (payload.phase === 'draft') {
                setCurrentView(3);
                setArticle((p) => p && !p.draft ? { ...p, draft: { content: "", format: "markdown" } } : p);
              }
            }

            // Thinking tokens for JSON phases (brief / outline / seo)
            if (payload.thinkingChunk) {
              setThinkingText((prev) => prev + payload.thinkingChunk);
            }

            // Draft tokens — stream into editor
            if (payload.chunk) {
              draftAccumulated += payload.chunk;
              setDraftAccumulated(draftAccumulated);
              setWordCount(draftAccumulated.trim().split(/\s+/).length);
              setArticle((p) => p ? { ...p, draft: { content: draftAccumulated, format: "markdown" } } : null);
              
              // Dynamic ETA adjustment
              if (wordCount > 100 && etaSeconds === 180) setEtaSeconds(120);
            }

            // Brief parsed and saved
            if (payload.briefDone) {
              setArticle((p) => p ? { ...p, brief: payload.briefDone } : null);
              setThinkingText("");
              toast.success("Content brief and keyword strategy generated!");
            }

            // Outline parsed and saved
            if (payload.outlineDone) {
              setArticle((p) => p ? { ...p, outline: payload.outlineDone } : null);
              setThinkingText("");
              setEtaSeconds(90); // Outline done, usually ~90s left for draft + seo
              toast.success("Article outline structured successfully!");
            }

            // SEO parsed and saved
            if (payload.seoDone) {
              setArticle((p) => p ? { ...p, optimization: payload.seoDone } : null);
              setThinkingText("");
              toast.success("SEO analysis complete!");
            }

            // Fully done — reload from Firestore and jump to draft view
            if (payload.done) {
              const articleRes = await fetch(`/api/articles/${articleId}`, {});
              if (articleRes.ok) {
                const { article: data } = await articleRes.json();
                const optimizations = data.optimizations || null;
                setArticle({
                  articleId: data.id,
                  keyword: data.keyword,
                  intent: data.intent,
                  articleType: data.articleType,
                  siteId: data.siteId,
                  siteDomain: data.siteDomain,
                  featuredImage: data.featuredImage || null,
                  brief: data.brief || null,
                  outline: data.outline || null,
                  draft: data.draft || null,
                  optimization: optimizations,
                  socialMedia: optimizations?.socialMedia || null,
                  settings: data.settings,
                });
                setCurrentView(3);
              }
                // Calculate duration
                if (genStartTime) {
                  const diff = Math.floor((Date.now() - genStartTime) / 1000);
                  const mins = Math.floor(diff / 60);
                  const secs = diff % 60;
                  setGenDuration(`${mins}m ${secs}s`);
                }
                
                toast.success("Auto-Pilot complete! Your full draft is ready.");
                setAutoPilotRunning(false);
                setAutoPilotPhase(null);
                setThinkingText("");
                setEtaSeconds(null);
                setShowSuccess(true);
                break;
            }
          } catch (parseErr: any) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info("Auto-Pilot cancelled.");
        return;
      }
      const msg = err.message || 'Auto-Pilot encountered an error';
      setError(msg);
      toast.error(msg);
    } finally {
      setAutoPilotRunning(false);
      setAutoPilotPhase(null);
      setEtaSeconds(null);
    }
  };

  // Handle publish to Pubwize blog
  const handlePublishToBlog = async () => {
    if (blogPublishing || !article) return;
    setBlogPublishing(true);
    try {
      const tags = blogTagsInput
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/blog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.articleId,
          slug: blogSlug || undefined,
          title: blogTitle || undefined,
          description: blogDescription || undefined,
          tags: tags.length ? tags : undefined,
          featuredImage: article.featuredImage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setBlogPublished(true);
      setBlogPublishedUrl(`/blog/${data.slug}`);
      toast.success("Published to the Pubwize blog!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish to blog");
    } finally {
      setBlogPublishing(false);
    }
  };

  // Handle upgrade required
  const handleUpgradeRequired = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top bar skeleton */}
        <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 border-b border-border">
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          <div className="h-3 w-px bg-border" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-md" />
          <div className="ml-auto h-5 w-24 bg-muted animate-pulse rounded-md" />
        </div>
        {/* Command rail skeleton */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-muted/50 animate-pulse rounded-lg" />
          ))}
          <div className="ml-auto h-8 w-32 bg-muted/50 animate-pulse rounded-lg" />
        </div>
        {/* Step cards skeleton */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pt-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-muted/60 animate-pulse rounded" />
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2 pl-12">
                <div className="h-3 w-full bg-muted/40 animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-muted/40 animate-pulse rounded" />
                <div className="h-3 w-4/6 bg-muted/40 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2.5 pt-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Retrieving article workspace...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    const isRateLimited = fetchErrorCode === 'RATE_LIMIT_EXCEEDED';
    const isAuthError = fetchErrorCode === 'AUTHENTICATION_ERROR';
    const isNotFound = fetchErrorCode === 'NOT_FOUND';

    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {isNotFound ? 'Article not found' : isAuthError ? 'Authentication error' : isRateLimited ? 'Rate limit reached' : 'Unable to load article'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {error || 'The article could not be loaded. It may have been deleted or you may not have permission to view it.'}
          </p>
          {isRateLimited && fetchErrorRetryAfter && (
            <p className="text-xs text-amber-400">
              Please wait {fetchErrorRetryAfter} seconds before retrying.
            </p>
          )}
          {isAuthError && (
            <button
              onClick={() => router.push("/login")}
              className="mt-2 text-sm text-gold underline underline-offset-2 hover:text-gold/80"
            >
              Go to login →
            </button>
          )}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => { setLoading(true); setError(null); setFetchErrorCode(null); window.location.reload(); }}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard/articles")}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              ← Back to Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeStep = article ? getActiveStep(article) : 1;

  return (
    <div className={cn(
      "relative min-h-screen transition-all duration-700 ease-in-out flex flex-col",
      zenMode ? "bg-background" : ""
    )}>
      {/* ══ Neural Background (Animated) ══════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        <div className="motion-reduce:hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M0,50 Q25,30 50,50 T100,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.05"
            className="text-foreground"
            animate={{ d: ["M0,50 Q25,30 50,50 T100,50", "M0,50 Q25,70 50,50 T100,50", "M0,50 Q25,30 50,50 T100,50"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        
        {/* Dynamic Glow Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute top-[-10%] left-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full transition-colors duration-1000",
            activeStep === 1 ? "bg-cyan-500/20" : 
            activeStep === 2 ? "bg-indigo-500/20" : 
            activeStep === 3 ? "bg-purple-500/20" : "bg-teal-500/20"
          )} 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={cn(
            "absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full transition-colors duration-1000",
            activeStep === 1 ? "bg-blue-500/10" : 
            activeStep === 2 ? "bg-violet-500/10" : 
            activeStep === 3 ? "bg-fuchsia-500/10" : "bg-emerald-500/10"
          )} 
        />
      </div>
      </div>

      {/* Screen reader announcement region for streaming updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {(draftLoading || autoPilotRunning) && 'Generating content, please wait.'}
        {!draftLoading && !autoPilotRunning && article?.draft?.content && 'Draft generation complete.'}
      </div>

      {/* Zen Toggle — mobile only floating (md+ shows when in zen mode) */}
      <motion.button
        layout
        onClick={toggleZenMode}
        className={cn(
          "fixed z-[60] flex items-center gap-1.5 px-3 py-2 rounded-lg border shadow-2xl backdrop-blur-xl transition-all active:scale-95",
          zenMode
            ? "bottom-24 right-4 bg-card/80 border-border text-foreground font-black"
            : "bottom-20 right-4 bg-card/80 border-border text-muted-foreground hover:text-foreground hover:border-border/80 md:hidden"
        )}
      >
        {zenMode ? <Sparkles className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
        <span className="text-[10px] uppercase tracking-widest leading-none">
          {zenMode ? "Exit" : "Zen"}
        </span>
      </motion.button>


      {/* Top bar */}
      <AnimatePresence>
        {!zenMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-card/80 backdrop-blur-xl border-b border-border"
          >
            <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
              {/* Back */}
              <button
                onClick={() => router.push("/dashboard/articles")}
                className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground transition-all hover:text-foreground active:scale-95"
              >
                <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Articles</span>
              </button>
              <div className="h-3 sm:h-3.5 w-px bg-border" />
              {/* Keyword — hidden on md+ (shown in rail) */}
              <div className="flex md:hidden items-center gap-1 sm:gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-1.5 sm:px-2 py-0.5 sm:py-1">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-gold" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate text-[9px] sm:text-[10px] font-semibold text-gold">
                  {article.keyword}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                {/* Zen Mode — desktop */}
                <button
                  onClick={toggleZenMode}
                  className={cn(
                    "hidden md:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95",
                    zenMode
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  )}
                >
                  {zenMode ? <Sparkles className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                  {zenMode ? "Exit Zen" : "Zen Mode"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner — always visible regardless of zen mode */}
      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-3 sm:px-4 lg:px-8 py-2 sm:py-3 z-50 relative">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-destructive flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[10px] sm:text-xs font-semibold text-destructive/70 hover:text-destructive underline shrink-0 active:scale-95 touch-manipulation"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column Command Center body ─────────────────────────── */}
      <div className="flex flex-col flex-1 md:h-[calc(100vh-36px)] relative">

        {/* Compact Command Rail - Horizontal below header */}
        <AnimatePresence>
          {!zenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="sticky top-0 z-50 border-b border-border bg-card shadow-sm"
            >
              <CommandRail
                keyword={article.keyword}
                activeStep={activeStep}
                hasBrief={!!article.brief}
                hasOutline={!!article.outline}
                hasDraft={!!article.draft}
                seoScore={article.optimization ? Math.round(
                  article.optimization.seoScore ?? 0
                ) : 0}
                wordCount={wordCount}
                targetWordCount={article.settings?.targetWordCount ?? 2000}
                autoPilot={autoPilot}
                autoPilotRunning={autoPilotRunning}
                autoPilotPhase={autoPilotPhase}
                onToggleAutoPilot={() => setAutoPilot(p => !p)}
                onRunAutoPilot={handleAutoPilot}
                onStepClick={(step) => {
                  setExpandedSteps(prev => ({ ...prev, [step]: true }));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable content canvas */}
        <main className={cn(
          "flex-1 h-full overflow-y-auto transition-all duration-500",
          zenMode ? "pt-8 sm:pt-12 pb-32" : "px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-32"
        )}>
          <div className={cn(
            "mx-auto space-y-4 sm:space-y-5 lg:space-y-6 transition-all duration-500",
            zenMode ? "max-w-full px-4 sm:px-8 lg:px-12" : "max-w-5xl"
          )}>


            <AnimatePresence mode="popLayout">
              {/* Step 1: Brief */}
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn("transition-all duration-700", activeStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 hidden")}
              >
                <div className="mb-3.5">
                  <StepHeader
                    number={1}
                    label="SEO Brief"
                    description="Keyword research & content map"
                    icon={FileText}
                    status={activeStep > 1 ? "completed" : "active"}
                    isExpanded={!!expandedSteps[1]}
                    onToggle={() => setExpandedSteps(prev => ({ ...prev, 1: !prev[1] }))}
                  />
                </div>
                
                <AnimatePresence>
                  {expandedSteps[1] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-8"
                    >
                      {article.brief ? (
                        <BriefPanel
                          brief={article.brief}
                          keyword={article.keyword}
                          onGenerate={handleGenerateOutline}
                          onUpdate={(newBrief) => setArticle(p => p ? { ...p, brief: newBrief } : p)}
                          onUpgradeRequired={handleUpgradeRequired}
                          loading={outlineLoading}
                          done={!!article.outline}
                        />
                      ) : (
                        <GenerationProgress phase="brief" thinkingText={thinkingText} progress={autoPilotPhase === 'brief' ? 45 : 0} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Step 2: Outline */}
              {(article.outline || autoPilotPhase === 'outline' || activeStep >= 2) && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn("transition-all duration-700 relative", activeStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                >
                  <div className="mb-3.5">
                    <StepHeader
                      number={2}
                      label="Outline"
                      description="Structure your article outline and headings"
                      icon={List}
                      status={activeStep > 2 ? "completed" : activeStep === 2 ? "active" : "locked"}
                      isExpanded={!!expandedSteps[2]}
                      onToggle={() => setExpandedSteps(prev => ({ ...prev, 2: !prev[2] }))}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {expandedSteps[2] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pb-8"
                      >
                        {article.outline ? (
                          <OutlinePanel
                            outline={article.outline}
                            keyword={article.keyword}
                            onGenerate={(wordCount: number) => { handleGenerateDraft(wordCount); }}
                            loading={draftLoading}
                            done={!!article.draft}
                            onUpgradeRequired={handleUpgradeRequired}
                          />
                        ) : (
                          <GenerationProgress phase="outline" thinkingText={thinkingText} progress={autoPilotPhase === 'outline' ? 65 : 0} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Step 3: Draft */}
              {(article.draft || autoPilotPhase === 'draft' || activeStep >= 3) && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn("transition-all duration-700 relative", activeStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                >
                  <div className="mb-3.5">
                    <StepHeader
                      number={3}
                      label="Draft & Optimize"
                      description="Review, score, and refine your article"
                      icon={PenLine}
                      status={article.optimization ? "completed" : activeStep === 3 ? "active" : "locked"}
                      isExpanded={!!expandedSteps[3]}
                      onToggle={() => setExpandedSteps(prev => ({ ...prev, 3: !prev[3] }))}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {expandedSteps[3] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pb-8"
                      >
                        {article.draft ? (
                          <DraftPanel
                            draft={draftLoading || autoPilotRunning ? { ...article.draft, content: draftAccumulated } : article.draft}
                            keyword={article.keyword}
                            articleId={article.articleId}
                            siteDomain={article.siteDomain}
                            featuredImageUrl={article.featuredImage?.url || null}
                            onFeaturedImageChange={(img) =>
                              setArticle((p) => (p ? { ...p, featuredImage: img } : p))
                            }
                            onOptimize={handleOptimize}
                            onPublish={() => setShowWordPressPublish(true)}
                            loading={optLoading}
                            done={!!article.optimization}
                            hasSeoData={!!article.optimization}
                            targetWordCount={article.settings?.targetWordCount ?? 2000}
                            streaming={draftLoading || autoPilotRunning}
                            onUpgradeRequired={handleUpgradeRequired}
                            brief={article.brief}
                            onContentDirty={() => { draftDirtyRef.current = true; }}
                            lsiKeywords={article.optimization?.lsiKeywords}
                          />
                        ) : (
                          <GenerationProgress 
                            phase="draft" 
                            thinkingText={thinkingText} 
                            progress={autoPilotPhase === 'draft' ? phaseProgress : 0} 
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Step 3.5: SEO & SERP Preview */}
              {article.draft?.content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="mb-6 border-t border-border/60 pt-6"
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">SEO & SERP Preview</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Fine-tune how your article appears in search results.</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <SERPMetaEditor
                      title={metaTitle || article.optimization?.suggestedTitle || article.keyword}
                      description={metaDescription || article.optimization?.suggestedMetaDescription || extractedDescription}
                      onTitleChange={setMetaTitle}
                      onDescriptionChange={setMetaDescription}
                    />
                    <SERPPreviewCard
                      title={metaTitle || article.optimization?.suggestedTitle || article.keyword}
                      description={metaDescription || article.optimization?.suggestedMetaDescription || extractedDescription}
                      url={article.siteDomain || "yoursite.com"}
                      featuredImage={article.featuredImage?.url || null}
                      keyword={article.keyword}
                    />
                  </div>

                  {/* Keyword presence indicators */}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (metaTitle || article.optimization?.suggestedTitle || article.keyword)
                          .toLowerCase()
                          .includes(article.keyword.toLowerCase())
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )} />
                      Keyword in title
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (metaDescription || article.optimization?.suggestedMetaDescription || extractedDescription)
                          .toLowerCase()
                          .includes(article.keyword.toLowerCase())
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )} />
                      Keyword in description
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (metaTitle || article.optimization?.suggestedTitle || article.keyword).length <= 60
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )} />
                      Title length: {(metaTitle || article.optimization?.suggestedTitle || article.keyword).length}/60
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        (metaDescription || article.optimization?.suggestedMetaDescription || extractedDescription).length <= 160
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )} />
                      Desc length: {(metaDescription || article.optimization.suggestedMetaDescription || extractedDescription).length}/160
                    </span>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>
          </div>
        </main>
      </div>

      <AutoPilotOverlay
        isRunning={autoPilotRunning}
        phase={autoPilotPhase}
        progress={phaseProgress}
        wordCount={wordCount}
        targetWordCount={article.settings?.targetWordCount || 2000}
        thinkingText={thinkingText}
        onCancel={() => {
          autoPilotAbortRef.current?.abort();
          setAutoPilotRunning(false);
          setAutoPilotPhase(null);
          setEtaSeconds(null);
          toast.info("Auto-Pilot cancelled.");
        }}
        phasesCompleted={{
          brief: !!article.brief,
          outline: !!article.outline,
          draft: !!article.draft,
          seo: !!article.optimization,
        }}
      />

      {/* ── Sticky Bottom Action Bar (all screen sizes) ────────────── */}
      {article && !showSuccess && !autoPilotRunning && !loading && (
        <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between gap-3 px-4 py-2 sm:py-3 bg-card/90 backdrop-blur-xl border-t border-border">
          {/* Left: status pill */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              activeStep === 3 ? "bg-emerald-500 animate-pulse" : "bg-muted"
            )} />
            Step {activeStep} of 3
          </div>

          {/* Right: context CTAs */}
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            {article.draft?.content && (
              <button
                onClick={() => window.open(`/dashboard/articles/${article.articleId}/preview`, '_blank')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-card/50 px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-medium text-gray-300 hover:text-white hover:bg-card transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                Preview
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  const aiTitle = metaTitle || article.optimization?.suggestedTitle || article.keyword;
                  const desc = metaDescription || article.optimization?.suggestedMetaDescription || extractedDescription;
                  setBlogTitle(aiTitle);
                  setBlogDescription(desc);
                  setBlogTagsInput(article.articleType || "");
                  setBlogSlug(aiTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                  setShowBlogPublish(true);
                }}
                disabled={blogPublished}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-teal shadow-lg shadow-teal/10 hover:bg-teal/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {blogPublished ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {blogPublished ? "Published" : "Publish to Blog"}
              </button>
            )}
            <button
              onClick={() => setShowWordPressPublish(true)}
              disabled={!wordPressSites.some(s => s.connected)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-3 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-obsidian shadow-lg shadow-[#f59e0b]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Globe className="h-3.5 w-3.5" />
              Publish to WordPress
            </button>
          </div>
        </div>
      )}

      <SuccessCelebration
        show={showSuccess}
        wordCount={wordCount}
        seoScore={article.optimization?.seoScore || 85}
        timeTaken={genDuration}
        onClose={() => setShowSuccess(false)}
        onViewDraft={() => {
          setShowSuccess(false);
          setCurrentView(3);
          setExpandedSteps({ 3: true });
        }}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan="free"
        reason={upgradeReason}
        onUpgrade={(plan) => {
          router.push("/dashboard/settings?tab=billing");
        }}
      />

      {/* WordPress Publish Modal (global) */}
      {showWordPressPublish && article && (
        <FocusTrap onClose={() => setShowWordPressPublish(false)}>
          <div
            className="w-full max-w-2xl rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-display text-text-1 truncate">
                  Publish to WordPress
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm mt-1 text-text-3">
                  Configure and publish your article
                </p>
              </div>
              <button
                onClick={() => setShowWordPressPublish(false)}
                className="text-xl sm:text-2xl shrink-0 p-1 hover:bg-white/5 rounded transition-colors"
                style={{ color: "var(--text-3)" }}
                aria-label="Close publish dialog"
              >
                ×
              </button>
            </div>
            <WordPressPublishPanel
              articleId={article.articleId}
              title={metaTitle || article.optimization?.suggestedTitle || article.keyword}
              content={article.draft?.content || ""}
              sites={wordPressSites}
              featuredImageUrl={article.featuredImage?.url || undefined}
              onPublishSuccess={() => {
                toast.success("Published to WordPress!");
                setShowWordPressPublish(false);
              }}
            />
          </div>
        </FocusTrap>
      )}

      {/* ── Publish to Blog Dialog ─────────────────────────────── */}
      {showBlogPublish && article && (
        <FocusTrap onClose={() => !blogPublishing && setShowBlogPublish(false)}>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !blogPublishing && setShowBlogPublish(false)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">Publish to Blog</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure your article for the Pubwize blog.</p>
                </div>
                <button
                  onClick={() => setShowBlogPublish(false)}
                  disabled={blogPublishing}
                  className="text-lg leading-none text-muted-foreground hover:text-foreground disabled:opacity-50 p-1"
                >
                  ×
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-foreground/80">Article Title</label>
                <input
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Article title"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-foreground/80">URL Slug</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="shrink-0">pubwize.com/blog/</span>
                  <input
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 bg-transparent text-foreground outline-none min-w-0"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-foreground/80">Meta Description / Excerpt</label>
                <textarea
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  placeholder="Brief description for search results and blog cards"
                />
                <div className={cn(
                  "text-[10px] text-right",
                  blogDescription.length > 160 ? "text-red-500" : blogDescription.length > 140 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {blogDescription.length}/160
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-foreground/80">Tags (comma-separated)</label>
                <input
                  value={blogTagsInput}
                  onChange={(e) => setBlogTagsInput(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="SEO, Content Marketing, AI Writing"
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                <span>{wordCount.toLocaleString()} words</span>
                <span className="text-muted-foreground/30">·</span>
                <span>
                  {article.featuredImage?.url ? (
                    <span className="text-emerald-500">Featured image ✓</span>
                  ) : (
                    <span className="text-amber-500">No featured image</span>
                  )}
                </span>
                {article.optimization?.seoScore && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className={cn(
                      article.optimization.seoScore >= 80 ? "text-emerald-500" :
                      article.optimization.seoScore >= 60 ? "text-amber-500" : "text-red-500"
                    )}>
                      SEO {Math.round(article.optimization.seoScore)}
                    </span>
                  </>
                )}
              </div>

              {/* Publish / Result */}
              {blogPublished ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Published successfully!
                  </div>
                  <a
                    href={blogPublishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 underline underline-offset-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {blogPublishedUrl}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePublishToBlog}
                    disabled={blogPublishing || !blogSlug}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-teal text-obsidian font-bold text-sm px-4 py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {blogPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Publish Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowBlogPublish(false)}
                    disabled={blogPublishing}
                    className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
}
