"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Loader2,
  Globe,
  PenLine,
  ChevronDown,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceTopbarProps {
  keyword: string;
  articleId: string;
  zenMode: boolean;
  autoPilotRunning: boolean;
  autoPilotPhase: string | null;
  hasDraft: boolean;
  hasWordPressSite: boolean;
  isAdmin: boolean;
  blogPublished: boolean;
  onBack: () => void;
  onZenToggle: () => void;
  onRunAutoPilot: () => void;
  onPublishWordPress: () => void;
  onPublishBlog: () => void;
  onPreview: () => void;
}

export function WorkspaceTopbar({
  keyword,
  articleId,
  zenMode,
  autoPilotRunning,
  autoPilotPhase,
  hasDraft,
  hasWordPressSite,
  isAdmin,
  blogPublished,
  onBack,
  onZenToggle,
  onRunAutoPilot,
  onPublishWordPress,
  onPublishBlog,
  onPreview,
}: WorkspaceTopbarProps) {
  const phaseLabel =
    autoPilotPhase === "brief"
      ? "Analysing…"
      : autoPilotPhase === "outline"
      ? "Outlining…"
      : autoPilotPhase === "draft"
      ? "Writing…"
      : autoPilotPhase === "seo"
      ? "Optimising…"
      : "Running…";

  return (
    <AnimatePresence>
      {!zenMode && (
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-50 flex items-center gap-3 h-10 px-4 border-b border-border bg-card/90 backdrop-blur-xl shrink-0"
        >
          {/* ── Left: breadcrumb ──────────────────────────────────── */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Articles</span>
          </button>

          <div className="h-4 w-px bg-border/80" />

          {/* Keyword chip */}
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/8 px-2.5 py-1 max-w-[200px] sm:max-w-xs">
            <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate text-[11px] font-semibold text-amber-300 leading-none">
              {keyword}
            </span>
          </div>

          {/* ── Right: action cluster ─────────────────────────────── */}
          <div className="ml-auto flex items-center gap-2">
            {/* Zen Mode */}
            <button
              onClick={onZenToggle}
              className={cn(
                "hidden md:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95",
                zenMode
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              <PenLine className="h-3 w-3" />
              <span className="hidden lg:inline">Zen Mode</span>
            </button>

            {/* Auto-Pilot */}
            {autoPilotRunning ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-400 hidden sm:inline">
                  {phaseLabel}
                </span>
              </div>
            ) : (
              <button
                onClick={onRunAutoPilot}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-violet-900/30 hover:shadow-violet-900/50 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Zap className="h-3 w-3" />
                <span className="hidden sm:inline">Auto-Pilot</span>
              </button>
            )}

            {/* Preview — only when draft exists */}
            {hasDraft && (
              <button
                onClick={onPreview}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95"
              >
                <FileText className="h-3 w-3" />
                Preview
              </button>
            )}

            {/* Publish dropdown */}
            <PublishMenu
              hasDraft={hasDraft}
              hasWordPressSite={hasWordPressSite}
              isAdmin={isAdmin}
              blogPublished={blogPublished}
              onPublishWordPress={onPublishWordPress}
              onPublishBlog={onPublishBlog}
            />
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

// ── Compact publish dropdown ───────────────────────────────────────────
function PublishMenu({
  hasDraft,
  hasWordPressSite,
  isAdmin,
  blogPublished,
  onPublishWordPress,
  onPublishBlog,
}: {
  hasDraft: boolean;
  hasWordPressSite: boolean;
  isAdmin: boolean;
  blogPublished: boolean;
  onPublishWordPress: () => void;
  onPublishBlog: () => void;
}) {
  return (
    <div className="relative group">
      <button
        disabled={!hasDraft}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[11px] font-bold text-obsidian shadow-md shadow-amber-900/30 hover:shadow-amber-900/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Globe className="h-3 w-3" />
        Publish
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {/* Dropdown */}
      {hasDraft && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
          <div className="p-1">
            <button
              onClick={onPublishWordPress}
              disabled={!hasWordPressSite}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Globe className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-foreground">WordPress</p>
                <p className="text-[10px] text-muted-foreground">
                  {hasWordPressSite ? "Publish to connected site" : "No site connected"}
                </p>
              </div>
            </button>

            {isAdmin && (
              <button
                onClick={onPublishBlog}
                disabled={blogPublished}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ExternalLink className="h-4 w-4 text-teal-400 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    {blogPublished ? "Published to Blog ✓" : "Pubwize Blog"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Internal publication</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
