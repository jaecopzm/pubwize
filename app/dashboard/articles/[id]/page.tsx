"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  PenLine,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraftGeneration } from "@/components/article-editor/use-draft-generation";
import { useApiCalls } from "@/components/article-editor/use-api-calls";
import { useTypewriter } from "@/components/article-editor/use-typewriter";
import { useSidebar } from "@/components/ui/sidebar";
import { AutoPilotOverlay } from "@/components/article-editor/auto-pilot-overlay";
import { SuccessCelebration } from "@/components/article-editor/success-celebration";
import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { WordPressPublishPanel } from "@/components/wordpress";
import { getAuthHeaders } from "@/lib/hooks/use-auth";
import { useIsAdmin } from "@/lib/hooks/use-is-admin";
import { toast } from "sonner";
import type {
  BriefData,
  OutlineData,
  DraftData,
  OptimizationData,
  SocialMediaData,
  WordPressSite,
} from "@/lib/types";

// ── New layout components ───────────────────────────────────────────
import {
  WorkspaceTopbar,
  StepSidebar,
  MobileStepStrip,
  ContentCanvas,
  SEOSidePanel,
} from "./_components";

// ── Types ───────────────────────────────────────────────────────────
interface ArticleState {
  articleId: string;
  keyword: string;
  intent: string;
  articleType: string;
  siteId: string;
  siteDomain?: string;
  featuredImage?: {
    url: string;
    photographer?: string;
    photographerUrl?: string;
    unsplashId?: string;
  } | null;
  brief: BriefData | null;
  outline: OutlineData | null;
  draft: DraftData | null;
  optimization: OptimizationData | null;
  socialMedia: SocialMediaData | null;
  settings?: { targetWordCount?: number | null; tone?: string };
}

function getActiveStep(article: ArticleState): number {
  if (!article.outline) return 1;
  if (!article.draft) return 2;
  return 3;
}

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/#+\s+/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*>\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── FocusTrap (unchanged from original) ────────────────────────────
function FocusTrap({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
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
  const { setOpen, setOpenMobile } = useSidebar();
  const { isAdmin } = useIsAdmin();

  // ── Core article state ──────────────────────────────────────────
  const [article, setArticle] = useState<ArticleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchErrorCode, setFetchErrorCode] = useState<string | null>(null);
  const [fetchErrorRetryAfter, setFetchErrorRetryAfter] = useState<number | null>(null);

  // ── Loading flags ───────────────────────────────────────────────
  const [loader, setLoader] = useState(false);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [optLoading, setOptLoading] = useState(false);

  // ── Layout state ────────────────────────────────────────────────
  const [zenMode, setZenMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSEOOpen, setMobileSEOOpen] = useState(false);
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ── Auto-Pilot state ────────────────────────────────────────────
  const [autoPilotRunning, setAutoPilotRunning] = useState(false);
  const [autoPilotPhase, setAutoPilotPhase] = useState<
    "brief" | "outline" | "draft" | "seo" | null
  >(null);
  const [thinkingText, setThinkingText] = useState("");
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [genDuration, setGenDuration] = useState("");
  const autoPilotAbortRef = useRef<AbortController | null>(null);

  // ── Draft streaming ─────────────────────────────────────────────
  const [draftAccumulated, setDraftAccumulated] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const draftContentRef = useRef("");
  const draftDirtyRef = useRef(false);

  // ── Premium / meta state ────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [showWordPressPublish, setShowWordPressPublish] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // ── Blog publish state (admin) ──────────────────────────────────
  const [showBlogPublish, setShowBlogPublish] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [blogTagsInput, setBlogTagsInput] = useState("");
  const [blogPublishing, setBlogPublishing] = useState(false);
  const [blogPublished, setBlogPublished] = useState(false);
  const [blogPublishedUrl, setBlogPublishedUrl] = useState("");

  // Auto-derive slug
  useEffect(() => {
    setBlogSlug(
      blogTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }, [blogTitle]);

  // ── Derived values ──────────────────────────────────────────────
  const activeStep = article ? getActiveStep(article) : 1;

  const extractedDescription = useMemo(() => {
    if (!article?.draft?.content) return "";
    const stripped = stripMarkdown(article.draft.content);
    return stripped.slice(0, 160) + (stripped.length > 160 ? "…" : "");
  }, [article?.draft?.content]);

  const seoScore = article?.optimization
    ? Math.round(article.optimization.seoScore ?? 0)
    : 0;

  const targetWordCount = article?.settings?.targetWordCount ?? 2000;

  const readingTime = Math.ceil(wordCount / 200);

  const phaseProgress = useMemo(() => {
    if (!autoPilotRunning) return 0;
    if (autoPilotPhase === "brief") return 45;
    if (autoPilotPhase === "outline") return 65;
    if (autoPilotPhase === "draft") {
      return Math.min(65 + (wordCount / targetWordCount) * 30, 95);
    }
    if (autoPilotPhase === "seo") return 98;
    return 0;
  }, [autoPilotRunning, autoPilotPhase, wordCount, targetWordCount]);

  const hasConnectedWP = wordPressSites.some((s) => s.connected);

  // ── Custom hooks ────────────────────────────────────────────────
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
    setCurrentView: () => {},
  });

  // ── Effects ─────────────────────────────────────────────────────

  // Fetch article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/articles/${articleId}`, { headers });
        if (res.ok) {
          const { article: data } = await res.json();
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
          setMetaTitle(data.metaTitle || data.keyword || "");
          setMetaDescription(data.metaDescription || "");
        } else {
          const errorBody = await res.json().catch(() => ({}));
          const code = errorBody.code || "";
          setError(errorBody.error || `Request failed (${res.status})`);
          setFetchErrorCode(code);
          if (res.status === 429) {
            const retryAfter = parseInt(
              res.headers.get("Retry-After") || "30",
              10
            );
            setFetchErrorRetryAfter(retryAfter);
          }
        }
      } catch {
        setError("Network error — please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();

    // Track view (fire-and-forget)
    (async () => {
      try {
        const headers = await getAuthHeaders();
        await fetch("/api/articles/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ articleId }),
        });
      } catch {}
    })();
  }, [articleId]);

  // Sync word count when article loads
  useEffect(() => {
    if (article?.draft?.content) {
      setWordCount(article.draft.content.trim().split(/\s+/).length);
    }
  }, [article?.draft?.content]);

  // Fetch WordPress sites
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
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draftDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Cleanup auto-pilot on unmount
  useEffect(() => {
    return () => { autoPilotAbortRef.current?.abort(); };
  }, []);

  // ETA countdown
  useEffect(() => {
    if (!autoPilotRunning || etaSeconds === null || etaSeconds <= 0) return;
    const interval = setInterval(() => {
      setEtaSeconds((prev) => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoPilotRunning, etaSeconds]);

  // ── Zen mode toggle ─────────────────────────────────────────────
  const toggleZenMode = () => {
    const next = !zenMode;
    setZenMode(next);
    setOpen(!next);
    setOpenMobile(false);
    if (next) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step click → scroll to anchor ──────────────────────────────
  const handleStepClick = (step: number) => {
    const el = stepRefs.current[step];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Alt + Z: Zen Mode
      if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        toggleZenMode();
      }

      // Alt + 1/2/3: Scroll to step
      if (e.altKey && ["1", "2", "3"].includes(e.key)) {
        const stepNum = parseInt(e.key, 10);
        const isAvailable =
          stepNum === 1 ||
          (stepNum === 2 && article?.outline) ||
          (stepNum === 3 && article?.draft);

        if (isAvailable) {
          e.preventDefault();
          handleStepClick(stepNum);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zenMode, article]);

  // ── Auto-Pilot ──────────────────────────────────────────────────
  const handleAutoPilot = async () => {
    if (autoPilotRunning || !article) return;
    setAutoPilotRunning(true);
    setAutoPilotPhase("brief");
    setThinkingText("");
    setDraftAccumulated("");
    setWordCount(0);
    setEtaSeconds(180);
    setGenStartTime(Date.now());
    setError(null);
    autoPilotAbortRef.current?.abort();
    autoPilotAbortRef.current = new AbortController();

    try {
      const res = await fetch("/api/articles/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
        signal: autoPilotAbortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Auto-Pilot failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let draftAcc = "";
      let raw = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const lines = raw.split("\n");
        raw = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;
          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) throw new Error(payload.error);
            if (payload.phase) {
              setAutoPilotPhase(payload.phase);
              setThinkingText("");
              if (payload.phase === "draft") {
                setArticle((p) =>
                  p && !p.draft ? { ...p, draft: { content: "", format: "markdown" } } : p
                );
              }
            }
            if (payload.thinkingChunk)
              setThinkingText((prev) => prev + payload.thinkingChunk);
            if (payload.chunk) {
              draftAcc += payload.chunk;
              setDraftAccumulated(draftAcc);
              setWordCount(draftAcc.trim().split(/\s+/).length);
              setArticle((p) =>
                p ? { ...p, draft: { content: draftAcc, format: "markdown" } } : null
              );
            }
            if (payload.briefDone) {
              setArticle((p) => (p ? { ...p, brief: payload.briefDone } : null));
              setThinkingText("");
              toast.success("Content brief and keyword strategy generated!");
            }
            if (payload.outlineDone) {
              setArticle((p) => (p ? { ...p, outline: payload.outlineDone } : null));
              setThinkingText("");
              setEtaSeconds(90);
              toast.success("Article outline structured successfully!");
            }
            if (payload.seoDone) {
              setArticle((p) => (p ? { ...p, optimization: payload.seoDone } : null));
              setThinkingText("");
              toast.success("SEO analysis complete!");
            }
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
              }
              if (genStartTime) {
                const diff = Math.floor((Date.now() - genStartTime) / 1000);
                setGenDuration(`${Math.floor(diff / 60)}m ${diff % 60}s`);
              }
              toast.success("Auto-Pilot complete! Your full draft is ready.");
              setAutoPilotRunning(false);
              setAutoPilotPhase(null);
              setThinkingText("");
              setEtaSeconds(null);
              setShowSuccess(true);
              break;
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Auto-Pilot cancelled.");
        return;
      }
      const msg = err.message || "Auto-Pilot encountered an error";
      setError(msg);
      toast.error(msg);
    } finally {
      setAutoPilotRunning(false);
      setAutoPilotPhase(null);
      setEtaSeconds(null);
    }
  };

  // ── Blog publish ────────────────────────────────────────────────
  const handlePublishToBlog = async () => {
    if (blogPublishing || !article) return;
    setBlogPublishing(true);
    try {
      const tags = blogTagsInput
        .split(",")
        .map((t) => t.trim())
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

  const handleUpgradeRequired = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  };

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Topbar skeleton */}
        <div className="h-10 border-b border-border bg-card/80 flex items-center gap-3 px-4">
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-px bg-border" />
          <div className="h-6 w-36 bg-muted animate-pulse rounded-md" />
          <div className="ml-auto flex gap-2">
            <div className="h-7 w-24 bg-muted/50 animate-pulse rounded-lg" />
            <div className="h-7 w-20 bg-muted/50 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="flex flex-1">
          {/* Sidebar skeleton */}
          <div className="hidden md:flex flex-col gap-2 w-60 border-r border-border p-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
          {/* Canvas skeleton */}
          <div className="flex-1 p-6 pl-10 space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                <div className="h-40 bg-muted/20 animate-pulse rounded-xl border border-border/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2.5 fixed bottom-8 inset-x-0">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">
            Retrieving article workspace…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (!article) {
    const isRateLimited = fetchErrorCode === "RATE_LIMIT_EXCEEDED";
    const isAuthError = fetchErrorCode === "AUTHENTICATION_ERROR";
    const isNotFound = fetchErrorCode === "NOT_FOUND";
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6 space-y-4">
          <div className="h-16 w-16 rounded-2xl border border-border bg-muted/30 flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isNotFound
              ? "Article not found"
              : isAuthError
              ? "Authentication error"
              : isRateLimited
              ? "Rate limit reached"
              : "Unable to load article"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {error ||
              "The article could not be loaded. It may have been deleted or you may not have permission to view it."}
          </p>
          {isRateLimited && fetchErrorRetryAfter && (
            <p className="text-xs text-amber-400">
              Please wait {fetchErrorRetryAfter}s before retrying.
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                setFetchErrorCode(null);
                window.location.reload();
              }}
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

  // ── Main render ─────────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* ── Subtle ambient glow ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className={cn(
            "absolute top-[-15%] left-[-10%] w-[500px] h-[500px] blur-[140px] rounded-full opacity-20 transition-all duration-1000",
            activeStep === 1
              ? "bg-cyan-500"
              : activeStep === 2
              ? "bg-indigo-500"
              : "bg-violet-500"
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] blur-[140px] rounded-full opacity-10 transition-all duration-1000",
            activeStep === 1
              ? "bg-blue-500"
              : activeStep === 2
              ? "bg-violet-500"
              : "bg-fuchsia-500"
          )}
        />
      </div>

      {/* ── Screen reader live region ────────────────────────── */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {(draftLoading || autoPilotRunning) && "Generating content, please wait."}
        {!draftLoading &&
          !autoPilotRunning &&
          article?.draft?.content &&
          "Draft generation complete."}
      </div>

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <WorkspaceTopbar
        keyword={article.keyword}
        articleId={article.articleId}
        zenMode={zenMode}
        autoPilotRunning={autoPilotRunning}
        autoPilotPhase={autoPilotPhase}
        hasDraft={!!article.draft}
        hasWordPressSite={hasConnectedWP}
        isAdmin={isAdmin}
        blogPublished={blogPublished}
        onBack={() => router.push("/dashboard/articles")}
        onZenToggle={toggleZenMode}
        onRunAutoPilot={handleAutoPilot}
        onPublishWordPress={() => setShowWordPressPublish(true)}
        onPublishBlog={() => {
          const aiTitle =
            metaTitle || article.optimization?.suggestedTitle || article.keyword;
          const desc =
            metaDescription ||
            article.optimization?.suggestedMetaDescription ||
            extractedDescription;
          setBlogTitle(aiTitle);
          setBlogDescription(desc);
          setBlogTagsInput(article.articleType || "");
          setBlogSlug(
            aiTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          );
          setShowBlogPublish(true);
        }}
        onPreview={() =>
          window.open(
            `/dashboard/articles/${article.articleId}/preview`,
            "_blank"
          )
        }
      />

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 z-40 relative">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-destructive flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold text-destructive/70 hover:text-destructive underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile step strip ───────────────────────────────────── */}
      <MobileStepStrip
        activeStep={activeStep}
        hasBrief={!!article.brief}
        hasOutline={!!article.outline}
        hasDraft={!!article.draft}
        autoPilotRunning={autoPilotRunning}
        autoPilotPhase={autoPilotPhase}
        onStepClick={handleStepClick}
      />

      {/* ── 3-column body ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Step Sidebar */}
        {!zenMode && (
          <StepSidebar
            activeStep={activeStep}
            hasBrief={!!article.brief}
            hasOutline={!!article.outline}
            hasDraft={!!article.draft}
            wordCount={wordCount}
            targetWordCount={targetWordCount}
            seoScore={seoScore}
            autoPilotRunning={autoPilotRunning}
            autoPilotPhase={autoPilotPhase}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
            onStepClick={handleStepClick}
          />
        )}

        {/* Center: Content Canvas */}
        <ContentCanvas
          articleId={article.articleId}
          keyword={article.keyword}
          siteDomain={article.siteDomain}
          zenMode={zenMode}
          brief={article.brief}
          outline={article.outline}
          draft={article.draft}
          optimization={article.optimization}
          featuredImageUrl={article.featuredImage?.url || null}
          targetWordCount={targetWordCount}
          lsiKeywords={article.optimization?.lsiKeywords}
          activeStep={activeStep}
          autoPilotRunning={autoPilotRunning}
          autoPilotPhase={autoPilotPhase}
          outlineLoading={outlineLoading}
          draftLoading={draftLoading}
          optLoading={optLoading}
          thinkingText={thinkingText}
          phaseProgress={phaseProgress}
          draftAccumulated={draftAccumulated}
          wordCount={wordCount}
          stepRefs={stepRefs}
          onGenerateOutline={handleGenerateOutline}
          onUpdateBrief={(newBrief) =>
            setArticle((p) => (p ? { ...p, brief: newBrief } : p))
          }
          onGenerateDraft={handleGenerateDraft}
          onOptimize={handleOptimize}
          onPublish={() => setShowWordPressPublish(true)}
          onFeaturedImageChange={(img) =>
            setArticle((p) => (p ? { ...p, featuredImage: img } : p))
          }
          onContentDirty={() => { draftDirtyRef.current = true; }}
          onUpgradeRequired={handleUpgradeRequired}
        />

        {/* Right: SEO Side Panel */}
        <SEOSidePanel
          show={!!article.draft && !zenMode}
          isOpenMobile={mobileSEOOpen}
          onCloseMobile={() => setMobileSEOOpen(false)}
          articleId={article.articleId}
          keyword={article.keyword}
          siteDomain={article.siteDomain || ""}
          draftContent={article.draft?.content || ""}
          metaTitle={
            metaTitle ||
            article.optimization?.suggestedTitle ||
            article.keyword
          }
          metaDescription={
            metaDescription ||
            article.optimization?.suggestedMetaDescription ||
            extractedDescription
          }
          seoScore={seoScore}
          wordCount={wordCount}
          targetWordCount={targetWordCount}
          readingTime={readingTime}
          wordPressSites={wordPressSites}
          featuredImageUrl={article.featuredImage?.url || null}
          lsiKeywords={article.optimization?.lsiKeywords}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          onPublishWordPressSuccess={() => {
            toast.success("Published to WordPress!");
            setShowWordPressPublish(false);
          }}
          onContentUpdate={(content) =>
            setArticle((p) =>
              p ? { ...p, draft: { ...p.draft!, content } } : p
            )
          }
        />
      </div>

      {/* ── Zen mode exit button (floating) ─────────────────────── */}
      {zenMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleZenMode}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/90 backdrop-blur-xl px-4 py-2 text-xs font-bold text-muted-foreground shadow-2xl hover:text-foreground transition-all active:scale-95"
        >
          <PenLine className="h-3.5 w-3.5" />
          Exit Zen
        </motion.button>
      )}

      {/* ── Mobile Floating SEO Action Button ────────────────────── */}
      {article.draft && !zenMode && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileSEOOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-xl shadow-violet-950/40 border border-violet-500/20"
            title="SEO & Metrics"
          >
            <BarChart2 className="h-5 w-5" />
          </motion.button>
        </div>
      )}

      {/* ── Auto-Pilot overlay (bottom-right card) ──────────────── */}
      <AutoPilotOverlay
        isRunning={autoPilotRunning}
        phase={autoPilotPhase}
        progress={phaseProgress}
        wordCount={wordCount}
        targetWordCount={targetWordCount}
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

      {/* ── Success celebration ──────────────────────────────────── */}
      <SuccessCelebration
        show={showSuccess}
        wordCount={wordCount}
        seoScore={article.optimization?.seoScore || 85}
        timeTaken={genDuration}
        onClose={() => setShowSuccess(false)}
        onViewDraft={() => {
          setShowSuccess(false);
          handleStepClick(3);
        }}
      />

      {/* ── Upgrade modal ────────────────────────────────────────── */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan="free"
        reason={upgradeReason}
        onUpgrade={() => router.push("/dashboard/settings?tab=billing")}
      />

      {/* ── WordPress publish modal ──────────────────────────────── */}
      {showWordPressPublish && article && (
        <FocusTrap onClose={() => setShowWordPressPublish(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-card p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Publish to WordPress
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure and publish your article
                </p>
              </div>
              <button
                onClick={() => setShowWordPressPublish(false)}
                className="text-xl p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
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

      {/* ── Blog publish dialog (admin) ──────────────────────────── */}
      {showBlogPublish && article && (
        <FocusTrap
          onClose={() => !blogPublishing && setShowBlogPublish(false)}
        >
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !blogPublishing && setShowBlogPublish(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Publish to Blog
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure your article for the Pubwize blog.
                  </p>
                </div>
                <button
                  onClick={() => setShowBlogPublish(false)}
                  disabled={blogPublishing}
                  className="text-xl p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Article Title">
                  <input
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    placeholder="Article title"
                  />
                </Field>
                <Field label="URL Slug">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <span className="shrink-0">pubwize.com/blog/</span>
                    <input
                      value={blogSlug}
                      onChange={(e) =>
                        setBlogSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      className="flex-1 bg-transparent text-foreground outline-none min-w-0"
                    />
                  </div>
                </Field>
                <Field label="Meta Description / Excerpt">
                  <textarea
                    value={blogDescription}
                    onChange={(e) => setBlogDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                    placeholder="Brief description for search results"
                  />
                  <div
                    className={cn(
                      "text-[10px] text-right mt-0.5",
                      blogDescription.length > 160
                        ? "text-rose-500"
                        : blogDescription.length > 140
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {blogDescription.length}/160
                  </div>
                </Field>
                <Field label="Tags (comma-separated)">
                  <input
                    value={blogTagsInput}
                    onChange={(e) => setBlogTagsInput(e.target.value)}
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    placeholder="SEO, Content Marketing, AI Writing"
                  />
                </Field>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-4 mb-5 text-xs text-muted-foreground">
                <span>{wordCount.toLocaleString()} words</span>
                <span className="text-muted-foreground/30">·</span>
                {article.featuredImage?.url ? (
                  <span className="text-emerald-500">Featured image ✓</span>
                ) : (
                  <span className="text-amber-500">No featured image</span>
                )}
                {seoScore > 0 && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span
                      className={cn(
                        seoScore >= 80
                          ? "text-emerald-500"
                          : seoScore >= 60
                          ? "text-amber-500"
                          : "text-rose-500"
                      )}
                    >
                      SEO {seoScore}
                    </span>
                  </>
                )}
              </div>

              {blogPublished ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Published successfully!
                  </div>
                  <a
                    href={blogPublishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
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
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-obsidian font-bold text-sm px-4 py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

// ── Small field wrapper ─────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}
