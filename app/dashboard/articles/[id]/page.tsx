"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, FileText, List, PenLine, TrendingUp, Copy, Check, Download, FileCode, FileJson, Plus, Trash2, Code, Share2, Zap, ChevronRight } from "lucide-react";
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
import { SocialPanel } from "@/components/article-editor/social-panel";
import { StatPill, CopyButton } from "@/components/article-editor/shared-ui";

import { UnsplashSearch } from "@/components/unsplash-search";
import { AIImprovePanel } from "@/components/article-editor/ai-improve-panel";
import { SectionRegenerate } from "@/components/article-editor/section-regenerate";
import { GenerationProgress } from "@/components/article-editor/generation-progress";
import { AutoPilotOverlay } from "@/components/article-editor/auto-pilot-overlay";
import { useTypewriter } from "@/components/article-editor/use-typewriter";
import { SuccessCelebration } from "@/components/article-editor/success-celebration";

import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { calculateReadabilityScores, detectReadabilityIssues } from "@/lib/readability";
import { calculateSEOScore } from "@/lib/seo-scoring";
import { getAuthHeaders } from "@/lib/hooks/use-auth";
import type { BriefData, OutlineData, DraftData, OptimizationData, SocialMediaData, WordPressSite, ReadabilityScores, ReadabilityIssue } from "@/lib/types";
import { toast } from "sonner";

interface ArticleState {
  articleId: string;
  keyword: string;
  intent: string;
  articleType: string;
  siteId: string;
  siteDomain?: string;
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
  { id: 3, key: "draft", label: "Draft", icon: PenLine, description: "Full AI-written article" },
  { id: 4, key: "social", label: "Social & Publish", icon: Share2, description: "Social posts & WordPress" },
] as const;

function getActiveStep(article: ArticleState): number {
  if (!article.outline) return 1;      // Show Brief + "Generate Outline" CTA
  if (!article.draft) return 2;        // Show Outline + "Generate Draft" CTA
  if (!article.socialMedia) return 3;  // Show Draft + "Generate Social" CTA
  return 4;                             // Show Social results
}


// ── Step 4: SEO ──────────────────────────────────────────────────────
function SEOPanel({ optimization, articleId, keyword, content, featuredImage, brief, onGenerateSocial, isGeneratingSocial, onContentUpdate }: {
  optimization: OptimizationData;
  articleId: string;
  keyword: string;
  content: string;
  featuredImage?: string | null;
  brief: BriefData | null;
  onGenerateSocial: () => void;
  isGeneratingSocial?: boolean;
  onContentUpdate?: (content: string) => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showWordPressPublish, setShowWordPressPublish] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);
  const [wordPressSites, setWordPressSites] = useState<WordPressSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);

  // Fetch WordPress sites
  useEffect(() => {
    const fetchWordPressSites = async () => {
      try {
        const response = await fetch('/api/wordpress/sites', {});

        if (response.ok) {
          const data = await response.json();
          setWordPressSites(data.sites || []);
        }
      } catch (error) {
        console.error('Error fetching WordPress sites:', error);
      } finally {
        setLoadingSites(false);
      }
    };

    fetchWordPressSites();
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAIFixAll = async () => {
    setFixingAll(true);
    let fixedContent = "";
    
    try {

      toast.info("AI is fixing all issues...");

      // Combine all suggestions into one request
      const allSuggestions = optimization.suggestions?.join('\n') || '';

      const res = await fetch('/api/articles/ai-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          content,
          suggestion: allSuggestions,
          keyword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply fixes');
      }

      // Stream the fixes and update content in real-time
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulatedRaw = "";

      while (true) {
        const { done: rdDone, value } = await reader.read();
        if (rdDone) break;

        accumulatedRaw += decoder.decode(value, { stream: true });
        const lines = accumulatedRaw.split("\n");
        accumulatedRaw = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) throw new Error(payload.error);
            
            if (payload.chunk) {
              fixedContent += payload.chunk;
              // Update content in real-time
              if (onContentUpdate) {
                onContentUpdate(fixedContent);
              }
            }
            
            if (payload.done) {
              toast.success("All fixes applied!");
            }
          } catch (parseErr) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (error) {
      console.error('AI fix error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply fixes');
    } finally {
      setFixingAll(false);
    }
  };

  // Calculate SEO score using comprehensive algorithm
  const seoScoreData = useMemo(() => calculateSEOScore(content, keyword), [content, keyword]);
  const seoScore = seoScoreData.overall;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--teal)';
    if (score >= 60) return 'var(--gold)';
    return '#ff6b6b';
  };

  const readability = useMemo(() => calculateReadabilityScores(content), [content]);
  const readingTime = Math.ceil(content.trim().split(/\s+/).length / 250);

  const keywordCoverage = useMemo(() => {
    if (!optimization.lsiKeywords || optimization.lsiKeywords.length === 0) return [];
    return optimization.lsiKeywords.map(kw => {
      // Basic check for keyword presence
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return { keyword: kw, found: regex.test(content) };
    });
  }, [content, optimization.lsiKeywords]);

  const handleExport = (format: "markdown" | "html") => {
    if (format === "html") {
      const plain = content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
      navigator.clipboard.writeText(`<p>${plain}</p>`);
      toast.success("HTML copied to clipboard!");
    } else {
      navigator.clipboard.writeText(content);
      toast.success("Markdown copied to clipboard!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] xl:grid-cols-[360px_1fr] gap-3 sm:gap-4 items-start">
      {/* ── Left Column: Metrics & Analysis ── */}
      <div className="space-y-2.5 sm:space-y-3 md:space-y-4">

        {/* SEO Score Card */}
        <div className="rounded-xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/10 via-[#6366f1]/5 to-transparent p-4 sm:p-5 shadow-lg hover:shadow-[#6366f1]/10 transition-all duration-300">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider mb-1 text-foreground">SEO Score</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">Overall rating</p>
            </div>
            <div className="text-center shrink-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-[#818cf8] leading-none tracking-tighter">{seoScore}</div>
              <div className="text-[10px] sm:text-xs font-mono text-[#6366f1]/70 mt-0.5">/ 100</div>
            </div>
          </div>
          <div className="h-2 sm:h-2.5 rounded-full overflow-hidden bg-black/20 shadow-inner mb-4">
            <div
              className="h-full transition-all duration-1000 rounded-full"
              style={{
                width: `${seoScore}%`,
                background: getScoreColor(seoScore)
              }}
            />
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
            <div className="text-center p-2 rounded-lg bg-black/10 border border-white/5">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Keyword</p>
              <p className="text-base sm:text-lg font-black text-[#818cf8]">{seoScoreData.keyword.score}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/10 border border-white/5">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Structure</p>
              <p className="text-base sm:text-lg font-black text-[#818cf8]">{seoScoreData.structure.score}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/10 border border-white/5">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Readable</p>
              <p className="text-base sm:text-lg font-black text-[#818cf8]">{seoScoreData.readability.score}</p>
            </div>
          </div>
        </div>

        {/* Meta Title */}
        {optimization?.suggestedTitle && (
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-foreground">Meta Title</h3>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                optimization.suggestedTitle.length <= 60
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-amber-400/10 text-amber-400 border-amber-400/20"
              )}>
                {optimization.suggestedTitle.length} chars
              </span>
            </div>
            <div className="group flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
              <p className="text-xs sm:text-sm leading-snug flex-1 text-foreground/90 break-words font-medium">{optimization.suggestedTitle}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(optimization.suggestedTitle || '');
                  toast.success("Title copied!");
                }}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-white/10 active:scale-95"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Meta Description */}
        {optimization?.suggestedMetaDescription && (
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-4 sm:p-5 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-foreground">Meta Description</h3>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                optimization.suggestedMetaDescription.length >= 150 && optimization.suggestedMetaDescription.length <= 160
                  ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                  : "bg-amber-400/10 text-amber-400 border-amber-400/20"
              )}>
                {optimization.suggestedMetaDescription.length} chars
              </span>
            </div>
            <div className="group flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
              <p className="text-xs sm:text-sm leading-snug flex-1 text-foreground/80 break-words">{optimization.suggestedMetaDescription}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(optimization.suggestedMetaDescription || '');
                  toast.success("Description copied!");
                }}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-white/10 active:scale-95"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Readability Metrics - Hidden for now due to poor scores from AI */}
        {/* TODO: Re-enable once AI generates more readable content (target Flesch 65-70) */}

        {/* Keyword Optimization - Hidden for now due to unreliable AI keyword placement */}
        {/* TODO: Re-enable once AI properly optimizes keyword density and placement */}

        {/* Quality Shield Audit - Hidden for now due to unreliable metrics */}
        {/* TODO: Re-enable once quality metrics are stable and accurate */}

        {/* LSI Keyword Coverage - Hidden for now due to unreliable AI generation */}
        {/* TODO: Re-enable once AI properly includes LSI keywords in content */}
        {/* Strategic Advantage (Competitor Insights) */}
        {brief?.competitorInsights && (
          <div className="rounded-xl border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/10 via-[#8b5cf6]/5 to-transparent p-4 sm:p-5 shadow-xl hover:shadow-[#8b5cf6]/10 transition-all duration-300">
            <h3 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider mb-4 text-[#a78bfa] flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Strategic Advantage
            </h3>
            <div className="space-y-4">
              {brief.competitorInsights.contentGaps.length > 0 && (
                <div className="p-3 rounded-lg bg-black/20 border border-[#8b5cf6]/10">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2.5 uppercase tracking-tight font-semibold">Content Gaps Filled</p>
                  <ul className="space-y-2">
                    {brief.competitorInsights.contentGaps.slice(0, 3).map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] sm:text-xs text-foreground/80 leading-relaxed">
                        <span className="text-[#a78bfa] mt-0.5 shrink-0">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.competitorInsights.headingPatterns.length > 0 && (
                <div className="p-3 rounded-lg bg-black/20 border border-[#8b5cf6]/10">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2.5 uppercase tracking-tight font-semibold">Competitor Patterns</p>
                  <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed italic">
                    {brief.competitorInsights.headingPatterns[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Column: Optimizations & Actions ── */}
      <div className="space-y-2.5 sm:space-y-3 md:space-y-4">

        {optimization.suggestedTitle && (
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
              Optimized Title
            </h3>
            <div className="group flex items-start justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3 hover:border-[#f59e0b]/30 hover:bg-[#f59e0b]/5 transition-all duration-300">
              <p className="text-xs sm:text-sm font-medium flex-1 text-foreground break-words leading-snug">{optimization.suggestedTitle}</p>
              <button
                onClick={() => copyToClipboard(optimization.suggestedTitle || '', 0)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-white/10 active:scale-95"
                aria-label="Copy title"
              >
                {copiedIndex === 0 ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        {optimization.suggestedMetaDescription && (
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
              <span>Meta Description</span>
              <span className={cn(
                "ml-auto text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                optimization.suggestedMetaDescription.length >= 150 && optimization.suggestedMetaDescription.length <= 160
                  ? "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20"
                  : "bg-amber-400/10 text-amber-400 border-amber-400/20"
              )}>
                {optimization.suggestedMetaDescription.length} chars
              </span>
            </h3>
            <div className="group flex items-start justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3 hover:border-[#22d3ee]/30 hover:bg-[#22d3ee]/5 transition-all duration-300">
              <p className="text-xs sm:text-sm leading-snug flex-1 text-foreground/80 break-words">{optimization.suggestedMetaDescription}</p>
              <button
                onClick={() => copyToClipboard(optimization.suggestedMetaDescription || '', 1)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-white/10 active:scale-95"
                aria-label="Copy meta description"
              >
                {copiedIndex === 1 ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        {optimization.internalLinks && optimization.internalLinks.length > 0 && (
          <details className="group/details">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-400/20 bg-blue-400/5 px-3 py-2 hover:border-blue-400/30 transition-all">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-semibold text-text-1">Internal Links</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400/20 text-blue-400 font-bold">
                    {optimization.internalLinks.length}
                  </span>
                </div>
                <svg className="h-4 w-4 text-text-3 transition-transform group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="mt-2 space-y-2">
              {optimization.internalLinks.map((link, idx) => (
                <div key={idx} className="group rounded-lg border border-white/5 bg-surface-1 p-2.5 sm:p-3 transition-all hover:border-blue-400/30 duration-300">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-tight">Link {idx + 1}</p>
                    <button
                      onClick={() => {
                        const linkMarkdown = `[${link.anchorText}](${link.targetArticleUrl})`;
                        navigator.clipboard.writeText(linkMarkdown);
                        toast.success("Link copied!");
                      }}
                      className="text-[10px] sm:text-xs text-text-3 hover:text-text-1 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 transition-colors active:scale-95"
                    >
                      <Copy className="h-3 w-3" />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-text-1 mb-1 leading-snug line-clamp-1">{link.targetArticleTitle}</p>
                  <p className="text-[10px] sm:text-xs text-blue-400/80 bg-blue-400/5 px-2 py-1 rounded inline-block">"{link.anchorText}"</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {optimization.suggestions?.length > 0 && (
          <details className="group/tips">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 hover:border-amber-400/30 transition-all">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    <span className="text-[10px] font-bold">{optimization.suggestions.length}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-text-1">Optimization Tips</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAIFixAll();
                    }}
                    disabled={fixingAll}
                    className="flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] sm:text-xs font-semibold text-gold hover:bg-gold/20 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {fixingAll ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="hidden sm:inline">Fixing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span className="hidden sm:inline">Fix All</span>
                        <span className="sm:hidden">Fix</span>
                      </>
                    )}
                  </button>
                  <svg className="h-4 w-4 text-text-3 transition-transform group-open/tips:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5 sm:p-3">
              <ul className="space-y-1.5">
                {optimization.suggestions?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px] sm:text-xs text-text-2 leading-snug">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 text-[9px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {/* Schema Markup Preview */}
        {optimization.generatedSchema && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold font-mono-dm text-text-1">
              <span className="inline-block h-2 w-2 rounded-full bg-lilac animate-pulse" />
              <span>Automated Schema (JSON-LD)</span>
              <span className="ml-auto text-[10px] sm:text-xs font-normal text-text-3 px-2 py-0.5 rounded border border-white/5 bg-surface-2">
                Article/FAQ
              </span>
            </h3>
            <div className="group relative rounded-xl border border-white/5 bg-surface-1 p-3.5 sm:p-4 card-premium overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(optimization.generatedSchema || '');
                    toast.success("Schema copied to clipboard!");
                  }}
                  className="p-2 rounded-lg bg-surface-1/80 backdrop-blur-sm border border-white/10 text-text-3 hover:text-text-1 transition-all active:scale-95"
                  title="Copy JSON-LD"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <pre className="text-[10px] sm:text-xs font-mono text-text-3 max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                {optimization.generatedSchema}
              </pre>
            </div>
            <p className="text-[10px] text-text-4 italic px-1">Tip: This code is automatically injected into your WordPress post if using our connector.</p>
          </div>
        )}

        {/* Internal Linking Strategy */}
        {optimization.internalLinkingNotes && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold font-mono-dm text-text-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Linking Strategy</span>
            </h3>
            <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 sm:p-5">
              <p className="text-[11px] sm:text-xs leading-relaxed text-text-2">
                {optimization.internalLinkingNotes}
              </p>
            </div>
          </div>
        )}

        {/* Complete badge */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent px-5 py-4 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-400">Article Complete</p>
            <p className="text-xs text-emerald-500/70 leading-relaxed">Your article is optimized and ready to publish.</p>
          </div>
        </div>

        {/* Premium Export & Publish Options */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-white/5">
          <button
            onClick={() => handleExport("markdown")}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-white/10 bg-surface-2 px-3 sm:px-4 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-medium text-text-2 transition-all hover:bg-white/5 hover:text-text-1 hover:border-white/20 active:scale-95 touch-manipulation"
          >
            <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Markdown</span>
            <span className="sm:hidden">MD</span>
          </button>
          <button
            onClick={() => handleExport("html")}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-white/10 bg-surface-2 px-3 sm:px-4 py-2.5 sm:py-3.5 text-[10px] sm:text-xs font-medium text-text-2 transition-all hover:bg-white/5 hover:text-text-1 hover:border-white/20 active:scale-95 touch-manipulation"
          >
            <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Raw HTML</span>
            <span className="sm:hidden">HTML</span>
          </button>
          <button
            onClick={onGenerateSocial}
            disabled={isGeneratingSocial}
            className="col-span-2 w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-teal/30 bg-teal px-3 sm:px-5 py-2.5 sm:py-4 text-[10px] sm:text-sm font-semibold text-obsidian transition-all shadow-lg shadow-teal/10 hover:shadow-teal/20 hover:scale-[1.02] active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGeneratingSocial ? (
              <>
                <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Generate Social Media</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowWordPressPublish(true)}
            className="col-span-2 w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gold/30 bg-gold px-3 sm:px-5 py-2.5 sm:py-4 text-[10px] sm:text-sm font-semibold text-obsidian transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:scale-[1.02] active:scale-95 touch-manipulation"
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Publish to WordPress</span>
          </button>
        </div>

        {/* WordPress Publish Modal */}
        {showWordPressPublish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowWordPressPublish(false)}>
            <div className="w-full max-w-2xl rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold font-display text-text-1 truncate">Publish to WordPress</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm mt-1 text-text-3">Configure and publish your article</p>
                </div>
                <button onClick={() => setShowWordPressPublish(false)} className="text-xl sm:text-2xl shrink-0 p-1 hover:bg-white/5 rounded transition-colors" style={{ color: 'var(--text-3)' }}>×</button>
              </div>
              <WordPressPublishPanel
                articleId={articleId}
                title={keyword}
                content={content}
                sites={wordPressSites}
                featuredImageUrl={featuredImage || undefined}
                onPublishSuccess={(url) => {
                  toast.success("Published to WordPress!");
                  setShowWordPressPublish(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
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
  const [socialLoading, setSocialLoading] = useState(false);
  const [currentView, setCurrentView] = useState<number>(1); // Track which step to show
  const [error, setError] = useState<string | null>(null);
  const [zenMode, setZenMode] = useState(false);
  const { setOpen, setOpenMobile } = useSidebar();
  const draftContentRef = useRef("");

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
  
  // New premium UI state
  const [draftAccumulated, setDraftAccumulated] = useState("");
  const typewriterDraft = useTypewriter(draftAccumulated, 8);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });
  const [wordCount, setWordCount] = useState(0);

  // Custom hooks for API calls and draft generation
  const { handleGenerateOutline, handleOptimize, handleGenerateSocial } = useApiCalls({
    articleId,
    setLoader,
    setOutlineLoading,
    setOptLoading,
    setSocialLoading,
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

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`, {});

        if (res.ok) {
          const { article: data } = await res.json();
          console.log("Article data loaded:", data);
          setArticle({
            articleId: data.id,
            keyword: data.keyword,
            intent: data.intent,
            articleType: data.articleType,
            siteId: data.siteId,
            siteDomain: data.siteDomain,
            brief: data.brief || null,
            outline: data.outline || null,
            draft: data.draft || null,
            optimization: data.optimizations || null,
            socialMedia: data.socialMedia || null,
            settings: data.settings,
          });
        } else {
          console.error("Failed to fetch article:", res.status);
        }
      } catch (err) {
        console.error("Error fetching article:", err);
      }
      finally { setLoading(false); }
    };
    fetchArticle();
    
    // Track view (only once per session)
    const trackView = async () => {
      try {

        await fetch('/api/articles/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId }),
        });
      } catch (error) {
        // Silent fail - view tracking is not critical
      }
    };
    
    trackView();
  }, [articleId]);

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

    try {

      const res = await fetch('/api/articles/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
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
                setArticle({
                  articleId: data.id,
                  keyword: data.keyword,
                  intent: data.intent,
                  articleType: data.articleType,
                  siteId: data.siteId,
                  siteDomain: data.siteDomain,
                  brief: data.brief || null,
                  outline: data.outline || null,
                  draft: data.draft || null,
                  optimization: data.optimizations || null,
                  socialMedia: data.socialMedia || null,
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
      const msg = err.message || 'Auto-Pilot encountered an error';
      setError(msg);
      toast.error(msg);
    } finally {
      if (etaSeconds !== null) {
        setAutoPilotRunning(false);
        setAutoPilotPhase(null);
        setEtaSeconds(null);
      }
    }
  };

  // Handle upgrade required
  const handleUpgradeRequired = (reason: string) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  };

  const renderVal = (v: any) => {
    if (typeof v === 'object' && v !== null && 'value' in v) return v.value;
    return v;
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-obsidian">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-2xl animate-pulse" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange-500 shadow-lg shadow-gold/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-text-3 font-mono-dm">Loading your article…</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-1">Article not found</h1>
          <button
            onClick={() => router.push("/dashboard/articles")}
            className="mt-4 text-sm text-gold underline underline-offset-2 hover:text-gold/80"
          >
            ← Back to Articles
          </button>
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
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M0,50 Q25,30 50,50 T100,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
            animate={{ d: ["M0,50 Q25,30 50,50 T100,50", "M0,50 Q25,70 50,50 T100,50", "M0,50 Q25,30 50,50 T100,50"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d="M0,30 Q25,50 50,30 T100,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
            animate={{ d: ["M0,30 Q25,50 50,30 T100,30", "M0,30 Q25,10 50,30 T100,30", "M0,30 Q25,50 50,30 T100,30"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          />
        </svg>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal/5 blur-[120px] rounded-full" />
      </div>

      {/* Zen Toggle (Floating) */}
      <motion.button
        layout
        onClick={toggleZenMode}
        className={cn(
          "fixed bottom-8 right-8 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all active:scale-95 group",
          zenMode 
            ? "bg-gold border-gold text-obsidian font-black" 
            : "bg-surface-1/80 border-white/10 text-text-2 hover:text-text-1 hover:border-white/20"
        )}
      >
        {zenMode ? <Sparkles className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
        <span className="text-xs uppercase tracking-widest leading-none">
          {zenMode ? "Zen Mode Active" : "Zen Mode"}
        </span>
      </motion.button>
      {/* Top bar */}
      <AnimatePresence>
        {!zenMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-obsidian-80 backdrop-blur-xl border-b border-white/5"
          >
            <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3">
              <button
                onClick={() => router.push("/dashboard/articles")}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-2 transition-all hover:text-text-1 active:scale-95 touch-manipulation"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Articles</span>
              </button>
              <div className="h-4 w-px bg-border" />
              {/* Keyword chip */}
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-gold/30 bg-gold/10 px-2 sm:px-3 py-1 animate-float">
                <Sparkles className="h-3 w-3 shrink-0 text-gold" />
                <span className="max-w-[120px] sm:max-w-[260px] truncate text-[10px] sm:text-xs font-semibold text-gold">
                  {article.keyword}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* Auto-Pilot toggle */}
                <motion.button
                  onClick={() => autoPilot ? setAutoPilot(false) : setAutoPilot(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                    autoPilot
                      ? 'border-primary/50 bg-primary/15 text-primary shadow-lg shadow-primary/20'
                      : 'border-border bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-card'
                  )}
                  title="Auto-Pilot: Generate everything at once without manual steps"
                >
                  <Zap className={cn("h-3.5 w-3.5", autoPilot && "animate-pulse")} />
                  <span>Auto-Pilot</span>
                  <div className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    autoPilot ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                  )} />
                </motion.button>
                
                {/* Generate All button */}
                {autoPilot && !autoPilotRunning && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleAutoPilot}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate All
                  </motion.button>
                )}
                
                {/* Auto-Pilot running state */}
                {autoPilotRunning && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/10"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {autoPilotPhase === 'brief' ? 'Analyzing keyword...'
                        : autoPilotPhase === 'outline' ? 'Building outline...'
                          : autoPilotPhase === 'seo' ? 'Running SEO analysis...'
                            : 'Writing article...'}
                    </span>
                  </motion.div>
                )}
                
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono-dm text-text-3">
                  <span className="font-medium text-text-1">Step {activeStep}</span>
                  <span>of 4</span>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="border-t border-destructive/30 bg-destructive/10 px-4 sm:px-8 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-destructive flex-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs font-semibold text-destructive/70 hover:text-destructive underline shrink-0 active:scale-95 touch-manipulation"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-panel body -> Full width with Top Rail */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ── Mission Control Progress Rail ─────────────────────────── */}
        <AnimatePresence>
          {!zenMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full border-b border-white/10 bg-surface-1/50 backdrop-blur-md px-4 py-2 shrink-0 sticky top-0 z-40"
            >
              <ol className="flex items-center w-full max-w-4xl mx-auto justify-between">
                {STEPS.map((step, idx) => {
                  const isDone = activeStep > step.id;
                  const isActive = activeStep === step.id;
                  const Icon = step.icon;

                  return (
                    <li key={step.id} className="flex items-center flex-1 relative">
                      <div className="flex items-center gap-2 w-full relative z-10">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            isActive ? "border-gold bg-gold/10 text-gold" :
                              isDone ? "border-teal bg-teal/10 text-teal" :
                                "border-white/10 bg-surface-2 text-text-3"
                          )}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <p className={cn("text-xs font-bold hidden sm:block", isActive ? 'text-gold' : isDone ? 'text-teal' : 'text-text-3')}>
                          {step.label}
                        </p>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="absolute top-3.5 left-[50%] right-[-50%] h-[2px] -z-10 bg-white/5">
                          <div className="h-full bg-gradient-to-r from-teal to-gold transition-all" style={{ width: isDone ? '100%' : '0%' }} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Content Container ────────────────────────────────── */}
        <main className={cn("flex-1 overflow-y-auto pb-16", zenMode ? "pt-6" : "p-3 sm:p-4")}>
          <div className={cn("mx-auto space-y-4", zenMode ? "max-w-4xl" : "max-w-5xl")}>
            {/* Keyword Intelligence Strip - Removed for compactness */}

            <AnimatePresence mode="popLayout">
              {/* Step 1: Brief */}
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn("transition-all duration-700", activeStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 hidden")}
              >
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">Content Strategy & Brief</h2>
                    <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground">Review the auto-generated SEO strategy and competitor insights.</p>
                  </div>
                  <button 
                    onClick={() => setExpandedSteps(prev => ({ ...prev, 1: !prev[1] }))}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {expandedSteps[1] ? <ChevronRight className="rotate-90 transition-transform h-5 w-5" /> : <ChevronRight className="transition-transform h-5 w-5" />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {expandedSteps[1] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
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
                  <div className="absolute -top-8 left-8 bottom-full w-px bg-gradient-to-b from-teal/50 to-transparent -z-10" />
                  <div className="mb-4 sm:mb-6 pt-6 sm:pt-8 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">Article Outline</h2>
                      <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground">Adjust the structure before writing begins.</p>
                    </div>
                    <button 
                      onClick={() => setExpandedSteps(prev => ({ ...prev, 2: !prev[2] }))}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {expandedSteps[2] ? <ChevronRight className="rotate-90 transition-transform h-5 w-5" /> : <ChevronRight className="transition-transform h-5 w-5" />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {expandedSteps[2] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
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
                  <div className="absolute -top-8 left-8 bottom-full w-px bg-gradient-to-b from-teal/50 to-transparent -z-10" />
                  <div className="mb-4 sm:mb-6 pt-6 sm:pt-8 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">Article Draft</h2>
                      <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-muted-foreground">Review and edit the generated content.</p>
                    </div>
                    <button 
                      onClick={() => setExpandedSteps(prev => ({ ...prev, 3: !prev[3] }))}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {expandedSteps[3] ? <ChevronRight className="rotate-90 transition-transform h-5 w-5" /> : <ChevronRight className="transition-transform h-5 w-5" />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {expandedSteps[3] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {article.draft ? (
                          <DraftPanel
                            draft={draftLoading || autoPilotRunning ? { ...article.draft, content: draftAccumulated } : article.draft}
                            keyword={article.keyword}
                            articleId={article.articleId}
                            siteDomain={article.siteDomain}
                            onOptimize={handleOptimize}
                            onGenerateSocial={handleGenerateSocial}
                            onPublish={() => setShowWordPressPublish(true)}
                            loading={optLoading}
                            done={!!article.optimization}
                            hasSeoData={!!article.optimization}
                            targetWordCount={article.settings?.targetWordCount ?? 2000}
                            streaming={draftLoading || autoPilotRunning}
                            onUpgradeRequired={handleUpgradeRequired}
                            brief={article.brief}
                            socialLoading={socialLoading}
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

              {/* Step 4: Social Media & Publishing */}
              {(article.socialMedia || activeStep >= 4) && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn("transition-all duration-700 relative", activeStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                >
                  <div className="absolute -top-8 left-8 bottom-full w-px bg-gradient-to-b from-teal/50 to-transparent -z-10" />
                  <div className="mb-4 pt-6 border-t border-white/5">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Social Media & Publishing</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Generate social posts and publish to WordPress.</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Social Media Section */}
                    <SocialPanel
                      socialMedia={article.socialMedia}
                      articleId={article.articleId}
                      keyword={article.keyword}
                      content={article.draft?.content || ''}
                      onGenerate={handleGenerateSocial}
                      isGenerating={socialLoading}
                    />
                    
                    {/* WordPress Publishing Section */}
                    {article.socialMedia && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="mb-3">
                          <h3 className="text-base font-bold text-foreground">Publish to WordPress</h3>
                          <p className="mt-1 text-xs text-muted-foreground">Push your article directly to your WordPress site.</p>
                        </div>
                        <Button
                          onClick={() => setShowWordPressPublish(true)}
                          className="w-full sm:w-auto"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Publish to WordPress
                        </Button>
                      </div>
                    )}
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
          setAutoPilotRunning(false);
          setAutoPilotPhase(null);
          setEtaSeconds(null);
          toast.info("Auto-Pilot paused.");
        }}
        phasesCompleted={{
          brief: !!article.brief,
          outline: !!article.outline,
          draft: !!article.draft,
          seo: !!article.optimization,
        }}
      />

      {/* Mobile Sticky CTA Bar */}
      {article && !showSuccess && !autoPilotRunning && !loading && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-obsidian/80 backdrop-blur-xl border-t border-white/10 z-40 md:hidden flex items-center gap-3">
          {!article.draft ? (
             <button
                onClick={handleAutoPilot}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 text-xs font-bold text-white shadow-lg"
             >
                <Zap className="h-3.5 w-3.5 fill-white" />
                Auto-Pilot
             </button>
          ) : !article.optimization ? (
            <button
                onClick={handleOptimize}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal py-3.5 text-xs font-bold text-obsidian shadow-lg"
             >
                <TrendingUp className="h-3.5 w-3.5" />
                Run SEO
             </button>
          ) : (
            <button
                onClick={() => setShowWordPressPublish(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-xs font-bold text-white shadow-lg"
             >
                <Share2 className="h-3.5 w-3.5" />
                Publish
             </button>
          )}
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
    </div>
  );
}
