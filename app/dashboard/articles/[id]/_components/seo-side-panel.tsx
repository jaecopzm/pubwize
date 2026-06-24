"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  BarChart2,
  Globe,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERP_LIMITS } from "@/lib/serp-preview";
import { WordPressPublishPanel } from "@/components/wordpress";
import { LiveSEOScore } from "@/components/article-editor/live-seo-score";

interface SEOSidePanelProps {
  show: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  articleId: string;
  keyword: string;
  siteDomain: string;
  draftContent: string;
  metaTitle: string;
  metaDescription: string;
  seoScore: number;
  wordCount: number;
  targetWordCount: number;
  readingTime: number;
  wordPressSites: any[];
  featuredImageUrl?: string | null;
  lsiKeywords?: string[];
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onPublishWordPressSuccess: () => void;
  onContentUpdate?: (content: string) => void;
}

type PanelTab = "seo" | "serp" | "publish";

export function SEOSidePanel({
  show,
  isOpenMobile = false,
  onCloseMobile,
  articleId,
  keyword,
  siteDomain,
  draftContent,
  metaTitle,
  metaDescription,
  seoScore,
  wordCount,
  targetWordCount,
  readingTime,
  wordPressSites,
  featuredImageUrl,
  lsiKeywords,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onPublishWordPressSuccess,
  onContentUpdate,
}: SEOSidePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("seo");
  const [showStats, setShowStats] = useState(true);

  const tabs: { id: PanelTab; label: string; icon: React.ElementType }[] = [
    { id: "seo", label: "SEO", icon: BarChart2 },
    { id: "serp", label: "SERP", icon: Globe },
    { id: "publish", label: "Publish", icon: Zap },
  ];

  const seoColor =
    seoScore >= 80
      ? "text-emerald-400"
      : seoScore >= 60
      ? "text-amber-400"
      : "text-rose-400";

  const renderPanelInner = (isMobile: boolean) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile close header */}
      {isMobile && (
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/20 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
            SEO & Publish Metrics
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Quick stats bar ──────────────────────────────────── */}
      <div className="border-b border-border/60 px-4 py-3 shrink-0">
        <button
          onClick={() => setShowStats((p) => !p)}
          className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          Article Metrics
          {showStats ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 mt-3">
                <StatTile
                  label="Words"
                  value={wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : String(wordCount)}
                  sub={`/ ${targetWordCount >= 1000 ? `${(targetWordCount / 1000).toFixed(0)}k` : targetWordCount}`}
                  good={wordCount >= targetWordCount * 0.9}
                />
                <StatTile
                  label="Read time"
                  value={`${readingTime}m`}
                  good={readingTime >= 4}
                />
                <StatTile
                  label="SEO"
                  value={String(seoScore || "—")}
                  good={seoScore >= 70}
                  highlight={seoColor}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex border-b border-border/60 px-2 pt-1 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-all relative",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId={isMobile ? "seo-tab-indicator-mobile" : "seo-tab-indicator-desktop"}
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-violet-500 rounded-t-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "seo" && (
            <motion.div
              key="seo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <LiveSEOScore
                content={draftContent}
                keyword={keyword}
                lsiKeywords={lsiKeywords}
                onUpdate={onContentUpdate}
              />
            </motion.div>
          )}

          {activeTab === "serp" && (
            <motion.div
              key="serp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Compact Google Snippet Card */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Google Snippet Preview
                  </span>
                  {(metaTitle.length > SERP_LIMITS.TITLE_MAX || metaDescription.length > SERP_LIMITS.DESCRIPTION_MAX) && (
                    <span className="text-[8px] font-semibold text-amber-500 uppercase tracking-tight">
                      Truncated
                    </span>
                  )}
                </div>
                
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* favicon and domain */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-[8px] font-black text-neutral-500 uppercase">
                        {(siteDomain || "P").charAt(0)}
                      </div>
                      <span className="text-[#006621] dark:text-[#8ab4f8]/80 text-[10px] font-medium truncate">
                        {siteDomain || "yoursite.com"}
                      </span>
                    </div>

                    {/* title */}
                    <h4 className="text-xs font-semibold text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-tight truncate">
                      {metaTitle || "Untitled Page"}
                    </h4>

                    {/* description */}
                    <p className="text-[10px] text-[#545454] dark:text-[#bdc1c6] leading-normal break-words line-clamp-2">
                      {metaDescription || "No description provided. Write one below to optimize search visibility."}
                    </p>
                  </div>

                  {/* Tiny Thumbnail */}
                  {featuredImageUrl && (
                    <div className="shrink-0 mt-0.5">
                      <img
                        src={featuredImageUrl}
                        alt="featured"
                        className="h-10 w-10 rounded object-cover border border-neutral-200 dark:border-neutral-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Meta Title Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
                    Meta Title
                  </label>
                  <span className={cn(
                    "text-[9px] font-mono tabular-nums",
                    metaTitle.length > SERP_LIMITS.TITLE_MAX ? "text-rose-500 font-bold" : "text-muted-foreground/60"
                  )}>
                    {metaTitle.length}/{SERP_LIMITS.TITLE_MAX}
                  </span>
                </div>
                <input
                  value={metaTitle}
                  onChange={(e) => onMetaTitleChange(e.target.value)}
                  placeholder="Meta title for search engines..."
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                />
              </div>

              {/* Compact Meta Description Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
                    Meta Description
                  </label>
                  <span className={cn(
                    "text-[9px] font-mono tabular-nums",
                    metaDescription.length > SERP_LIMITS.DESCRIPTION_MAX ? "text-rose-500 font-bold" : "text-muted-foreground/60"
                  )}>
                    {metaDescription.length}/{SERP_LIMITS.DESCRIPTION_MAX}
                  </span>
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => onMetaDescriptionChange(e.target.value)}
                  placeholder="Meta description for search engines..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/40 resize-none leading-normal"
                />
              </div>

              {/* Keyword indicators */}
              <div className="space-y-1.5 border border-border/60 rounded-xl p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Keyword Signals
                </p>
                {[
                  {
                    label: "Keyword in title",
                    pass: metaTitle.toLowerCase().includes(keyword.toLowerCase()),
                  },
                  {
                    label: "Keyword in description",
                    pass: metaDescription.toLowerCase().includes(keyword.toLowerCase()),
                  },
                  {
                    label: "Title ≤ 60 chars",
                    pass: metaTitle.length <= 60,
                    detail: `${metaTitle.length}/60`,
                  },
                  {
                    label: "Description ≤ 160 chars",
                    pass: metaDescription.length <= 160,
                    detail: `${metaDescription.length}/160`,
                  },
                ].map((check) => (
                  <div key={check.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          check.pass ? "bg-emerald-500" : "bg-amber-500"
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {check.label}
                      </span>
                    </div>
                    {check.detail && (
                      <span
                        className={cn(
                          "text-[9px] font-mono tabular-nums",
                          check.pass ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {check.detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "publish" && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <WordPressPublishPanel
                articleId={articleId}
                title={metaTitle || keyword}
                content={draftContent}
                sites={wordPressSites}
                featuredImageUrl={featuredImageUrl || undefined}
                onPublishSuccess={onPublishWordPressSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Panel (Persistent on large screens) */}
      <AnimatePresence>
        {show && (
          <motion.aside
            initial={{ opacity: 0, x: 24, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: 24, width: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:flex flex-col shrink-0 border-l border-border bg-card/60 backdrop-blur-sm overflow-hidden h-full"
            style={{ minWidth: 0 }}
          >
            {renderPanelInner(false)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Sheet Overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[360px] border-l border-border bg-card shadow-2xl overflow-hidden"
            >
              {renderPanelInner(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Small stat tile ─────────────────────────────────────────────────
function StatTile({
  label,
  value,
  sub,
  good,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  good?: boolean;
  highlight?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border/60 bg-muted/20 py-2.5 px-1">
      <span
        className={cn(
          "text-base font-black tabular-nums leading-none",
          highlight ?? (good ? "text-emerald-400" : "text-muted-foreground")
        )}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[8px] font-mono text-muted-foreground/60">
          {sub}
        </span>
      )}
      <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/50 mt-0.5">
        {label}
      </span>
    </div>
  );
}

