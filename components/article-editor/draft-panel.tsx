"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Check, List, Loader2, FileCode, Sparkles, Zap, Edit3, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateCTA } from "./shared-ui";
import { GenerationLoader } from "@/components/generation-loader";
import { UnsplashSearch } from "@/components/unsplash-search";
import { RichEditor, type RichEditorRef } from "./rich-editor";
import { WordCountRing } from "./word-count-ring";
import { SEOCommandCenter } from "./seo-command-center";
import { RepurposeButton } from "@/components/articles/repurpose-button";
import { analyzePatterns } from "@/lib/ai-pattern-detector";
import type { DraftData } from "@/lib/types";
import { getAuthHeaders } from "@/lib/hooks/use-auth";

// ── Utilities (outside component for hoisting) ────────────────────

const stripMarkdown = (md: string) =>
    md
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/~~(.+?)~~/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/!\[.*?\]\(.+?\)/g, "")
        .replace(/`(.+?)`/g, "$1")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/^>\s+/gm, "")
        .replace(/^\|.+\|$/gm, "")
        .replace(/^[-=]{3,}$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

// ── Simple markdown → HTML (for preview) ────────────────────
function markdownToHtml(md: string): string {
  if (!md) return "";
  let cleanMd = md.trim();
  if (cleanMd.startsWith("```markdown")) {
    cleanMd = cleanMd.replace(/^```markdown\s*\n/, "");
    if (cleanMd.endsWith("```")) {
      cleanMd = cleanMd.replace(/\n```$/, "");
    }
  } else if (cleanMd.startsWith("```")) {
    cleanMd = cleanMd.replace(/^```[a-zA-Z]*\s*\n/, "");
    if (cleanMd.endsWith("```")) {
      cleanMd = cleanMd.replace(/\n```$/, "");
    }
  }

  return cleanMd
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^[-*+] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hpuo])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, "");
}

// ── Component ─────────────────────────────────────────────────────

export function DraftPanel({
    draft,
    keyword,
    articleId,
    siteDomain,
    onGenerate,
    onOptimize,
    onPublish,
    loading,
    done,
    hasSeoData,
    targetWordCount,
    streaming = false,
    onUpgradeRequired,
    brief,
    featuredImageUrl,
    onFeaturedImageChange,
    onContentDirty,
    lsiKeywords,
}: {
    draft: DraftData;
    keyword: string;
    articleId: string;
    siteDomain?: string;
    onGenerate?: () => void;
    onOptimize: () => void;
    onPublish?: () => void;
    loading: boolean;
    done: boolean;
    hasSeoData?: boolean;
    targetWordCount?: number;
    streaming?: boolean;
    onUpgradeRequired?: (reason: string) => void;
    brief?: any;
    featuredImageUrl?: string | null;
    onFeaturedImageChange?: (img: { url: string; photographer?: string; photographerUrl?: string; unsplashId?: string } | null) => void;
    onContentDirty?: () => void;
    lsiKeywords?: string[];
}) {
    const [content, setContent] = useState(draft.content);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [showFeaturedImageSearch, setShowFeaturedImageSearch] = useState(false);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(featuredImageUrl ?? null);
    const [showStructure, setShowStructure] = useState(false);
    const [imageSearchQuery, setImageSearchQuery] = useState("");
    const [imageSearchSection, setImageSearchSection] = useState("");
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState("");
    const streamAbortRef = useRef<AbortController | null>(null);
    const editorRef = useRef<RichEditorRef>(null);

    // Lock body scroll when modals are open
    useEffect(() => {
        if (showFeaturedImageSearch || showImageSearch) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showFeaturedImageSearch, showImageSearch]);

    // ── Word count ───────────────────────────────────────────────────
    useEffect(() => {
        const plainText = stripMarkdown(content);
        const words = plainText.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setWordCount(words);
    }, [content]);

    // ── Headings for structure ───────────────────────────────────────
    const headings = useMemo(() => content.match(/^#{1,6}\s+.+$/gm) || [], [content]);

    // ── Sync external draft content when streaming from parent page ─
    const lastDraftContentRef = useRef<string>("");
    const contentInitializedRef = useRef(false);
    useEffect(() => {
        if (streaming && draft.content !== undefined && draft.content !== lastDraftContentRef.current) {
            lastDraftContentRef.current = draft.content;
            setContent(draft.content);
        }
    }, [streaming, draft.content]);

    // ── Track user edits (non-streaming content changes) ─────────
    const userEditRef = useRef(false);
    useEffect(() => {
        if (!contentInitializedRef.current) {
            contentInitializedRef.current = true;
            return;
        }
        if (!streaming && !userEditRef.current) {
            userEditRef.current = true;
            onContentDirty?.();
        }
    }, [content, streaming]);

    // ── Sync featured image from parent (e.g. refresh) ───────────────
    useEffect(() => {
        setFeaturedImage(featuredImageUrl ?? null);
    }, [featuredImageUrl]);

    const persistFeaturedImage = async (img: any | null) => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/articles/${articleId}/featured-image`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ featuredImage: img }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to save featured image");
            }
            onFeaturedImageChange?.(img);
        } catch (e: any) {
            toast.error(e?.message || "Failed to save featured image");
        }
    };

    // ── Auto-save every 30 seconds (skip during streaming or empty content) ──
    useEffect(() => {
        const timer = setInterval(() => {
            if (!streaming && content && content !== draft.content) handleSaveContent(true);
        }, 30000);
        return () => clearInterval(timer);
    }, [content, draft.content, streaming]);

    // ── Streaming generator ──────────────────────────────────────────
    const handleStreamGenerate = useCallback(async () => {
        if (isStreaming) return;

        const abort = new AbortController();
        streamAbortRef.current = abort;
        setIsStreaming(true);
        // Clear content immediately so old draft doesn't show while streaming
        setStreamContent("");
        setContent("");

        try {

            const res = await fetch("/api/articles/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId }),
                signal: abort.signal,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Generation failed");
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";
            let accumulatedRaw = "";
            let lastUpdateTime = 0;

            while (true) {
                const { done: rdDone, value } = await reader.read();
                if (rdDone) break;

                accumulatedRaw += decoder.decode(value, { stream: true });
                const lines = accumulatedRaw.split("\n");

                // Keep the last (potentially partial) line in the buffer
                accumulatedRaw = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith("data: ")) continue;

                    const dataStr = trimmedLine.slice(6);
                    if (dataStr === "[DONE]") continue;

                    try {
                        const payload = JSON.parse(dataStr);
                        if (payload.error) throw new Error(payload.error);

                        // Server is retrying — reset accumulator so we don't double content
                        if (payload.retry !== undefined) {
                            accumulatedContent = "";
                            setStreamContent("");
                            lastUpdateTime = 0;
                            continue;
                        }

                        if (payload.chunk) {
                            accumulatedContent += payload.chunk;
                            const now = performance.now();
                            if (now - lastUpdateTime > 50) {
                                setStreamContent(accumulatedContent);
                                lastUpdateTime = now;
                            }
                        }
                        if (payload.done) {
                            setStreamContent(accumulatedContent);
                            setContent(accumulatedContent);
                            setStreamContent("");
                            toast.success("Draft generated!");
                        }
                    } catch (parseErr) {
                        // Skip malformed lines
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== "AbortError") toast.error(err.message || "Generation failed");
        } finally {
            setIsStreaming(false);
            streamAbortRef.current = null;
        }
    }, [articleId, isStreaming]);

    // ── Save ─────────────────────────────────────────────────────────
    const handleSaveContent = async (isAutoSave = false) => {
        setIsSaving(true);
        try {

            const res = await fetch(`/api/articles/${articleId}/content`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save content");
            }
            setLastSaved(new Date());
            if (!isAutoSave) toast.success("Content saved!");
        } catch {
            toast.error("Failed to save content");
        } finally {
            setIsSaving(false);
        }
    };

    const exportContent = (format: "html" | "wp" | "docx") => {
        if (format === "html") {
            const plain = stripMarkdown(content).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
            navigator.clipboard.writeText(`<p>${plain}</p>`);
            toast.success("HTML copied!");
        } else if (format === "wp") {
            navigator.clipboard.writeText(content);
            toast.success("Copied for WordPress!");
        } else {
            toast.info("DOCX export coming soon!");
        }
    };

    // The displayed content — use content directly, or streamContent if currently streaming from this panel
    const displayContent = isStreaming ? streamContent : content;
    const currentWordCount = displayContent.split(/\s+/).filter(Boolean).length;
    const isAnyStreaming = isStreaming || streaming;

    // AI pattern analysis (client-side heuristic)
    const patternResult = useMemo(() => {
        if (!displayContent || displayContent.length < 100) return null;
        return analyzePatterns(displayContent);
    }, [displayContent]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-full space-y-4 overflow-x-hidden"
        >
            <SEOCommandCenter
                content={displayContent}
                keyword={keyword}
                targetWordCount={targetWordCount ?? 2000}
                onUpdate={setContent}
                lsiKeywords={lsiKeywords}
            />

            {/* Stats Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {/* Word Count Ring */}
                <div className="shrink-0 p-0.5 rounded-full border border-border bg-card shadow-sm">
                    <WordCountRing current={currentWordCount} target={targetWordCount ?? 2000} size={52} streaming={isAnyStreaming} />
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3 min-w-0">
                    {/* Words */}
                    <div className="relative overflow-hidden rounded-lg border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 p-3 shadow-sm">
                        {isAnyStreaming && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />}
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Words</div>
                        <div className="text-lg font-bold text-foreground relative z-10 tabular-nums leading-none">
                            {currentWordCount.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1 font-semibold">/ {targetWordCount}</span>
                        </div>
                    </div>
                    {/* Sections */}
                    <div className="relative overflow-hidden rounded-lg border border-purple-500/20 dark:border-purple-400/20 bg-purple-500/5 dark:bg-purple-400/5 p-3 shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Sections</div>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400 relative z-10 leading-none">
                            {headings.length}
                            <span className="text-[10px] text-purple-600/50 dark:text-purple-400/50 ml-1 font-semibold">tags</span>
                        </div>
                    </div>
                    {/* Human Score (AI pattern detector) — always visible */}
                    <div className="relative overflow-hidden rounded-lg border border-orange-500/20 dark:border-orange-400/20 bg-orange-500/5 dark:bg-orange-400/5 p-3 shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Human</div>
                        <div className={cn("text-lg font-bold leading-none", patternResult !== null ? (patternResult.overallScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : patternResult.overallScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400") : "text-muted-foreground")}>
                            {patternResult !== null ? patternResult.overallScore : "—"}
                            <span className="text-[10px] font-semibold ml-1">{patternResult !== null ? "%" : ""}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="grid gap-4 lg:grid-cols-12 w-full max-w-full">
                <div className="lg:col-span-12 space-y-4 w-full max-w-full overflow-x-hidden">
                    {/* Toolbar Row */}
                    <div className="flex items-center gap-2 sticky top-0 z-20 backdrop-blur-xl bg-card/80 p-2 rounded-lg border border-border shadow-sm w-full max-w-full overflow-x-auto">
                        {/* Edit / Preview toggle */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted border border-border shrink-0">
                            <button
                                onClick={() => setViewMode("edit")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    viewMode === "edit" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                            </button>
                            <button
                                onClick={() => setViewMode("preview")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                    viewMode === "preview" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Preview
                            </button>
                        </div>

                        <div className="h-5 w-px bg-border shrink-0" />

                        {/* Structure / Media */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setShowStructure(!showStructure)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all shrink-0",
                                    showStructure
                                        ? "border-primary/50 bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <List className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Structure</span>
                            </button>
                            <button
                                onClick={() => setShowImageSearch(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 dark:border-cyan-400/20 bg-cyan-500/10 dark:bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-400/20 transition-all active:scale-95 shrink-0"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Media</span>
                            </button>
                        </div>

                        <div className="flex-1" />

                        <div className="h-5 w-px bg-border shrink-0" />

                        {/* Save / Repurpose */}
                        <div className="flex items-center gap-2 shrink-0">
                            {isSaving ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary shrink-0">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Saving
                                </span>
                            ) : lastSaved ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Saved
                                </span>
                            ) : null}
                            <RepurposeButton
                                articleId={articleId}
                                articleTitle={keyword}
                                disabled={!content || content.length < 100}
                            />
                            <button
                                onClick={() => handleSaveContent()}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 shadow-sm shrink-0"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Save
                            </button>
                        </div>
                    </div>

                    {/* AI tip banner */}
                    <div className="rounded-lg border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 p-3 flex items-center gap-3">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Tip:</strong> Highlight text for AI actions.
                        </p>
                    </div>

                    {/* Featured Image */}
                    <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Featured Image</h4>
                            <button
                                onClick={() => setShowFeaturedImageSearch(true)}
                                className="p-1 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                            >
                                <Edit3 className="h-3 w-3" />
                            </button>
                        </div>
                        {featuredImage ? (
                            <div className="relative h-28 rounded-md overflow-hidden border border-border group cursor-pointer" onClick={() => setShowFeaturedImageSearch(true)}>
                                <img src={featuredImage} alt="Featured" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowFeaturedImageSearch(true)}
                                className="w-full h-20 rounded-md border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1 hover:bg-muted transition-all"
                            >
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[9px] font-semibold text-muted-foreground">Add Image</span>
                            </button>
                        )}
                    </div>

                    {/* ── Rich Text Editor / Preview ── */}
                    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 relative min-h-[400px] sm:min-h-[500px] shadow-sm">
                        {(isAnyStreaming || loading) && !displayContent && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm rounded-lg">
                                <GenerationLoader step="draft" message={isAnyStreaming ? "Generating..." : "Loading..."} keyword={keyword} />
                            </div>
                        )}
                        
                        {viewMode === "edit" ? (
                            <RichEditor
                                ref={editorRef}
                                value={displayContent}
                                onChange={setContent}
                                keyword={keyword}
                                articleId={articleId}
                                streaming={isAnyStreaming || loading}
                                onUpgradeRequired={onUpgradeRequired}
                            />
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ color: 'hsl(var(--foreground))' }}
                                className="max-w-none text-xs sm:text-sm leading-relaxed
                                         [&_h1]:text-lg [&_h1]:sm:text-xl [&_h1]:md:text-2xl [&_h1]:font-bold [&_h1]:mb-2.5 [&_h1]:mt-4
                                         [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:md:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3.5
                                         [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:font-bold [&_h3]:mb-1.5 [&_h3]:mt-3
                                         [&_p]:mb-2.5 [&_p]:leading-relaxed
                                         [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
                                         [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal
                                         [&_li]:mb-1.5
                                         [&_a]:text-primary [&_a]:underline
                                         [&_strong]:font-semibold
                                         [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                                         [&_img]:rounded-lg [&_img]:my-4 [&_img]:border [&_img]:border-border"
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(displayContent) }}
                            />
                        )}
                    </div>

                    {/* Export Options */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => exportContent("html")} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                            <FileCode className="h-3 w-3" /> 
                            <span className="hidden sm:inline">HTML</span>
                        </button>
                        <button onClick={() => exportContent("wp")} className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 dark:border-cyan-400/20 bg-cyan-500/10 dark:bg-cyan-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-400/20 transition-all">
                            <Copy className="h-3 w-3" /> 
                            <span className="hidden sm:inline">WordPress</span>
                        </button>
                        <button onClick={() => exportContent("docx")} className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/10 dark:bg-indigo-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 transition-all">
                            <Download className="h-3 w-3" /> 
                            <span className="hidden sm:inline">DOCX</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals are portaled to body, so they stay here */}
            {showFeaturedImageSearch && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md" onClick={() => setShowFeaturedImageSearch(false)}>
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-text-1">Select Featured Image</h3>
                                <p className="text-sm text-text-3 mt-1">Browse free high-quality images from Unsplash</p>
                            </div>
                            <button 
                                onClick={() => setShowFeaturedImageSearch(false)} 
                                className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-3 hover:text-text-1 transition-all active:scale-95"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <UnsplashSearch onSelectImage={(url, _attr, meta) => {
                                setFeaturedImage(url);
                                setShowFeaturedImageSearch(false);
                                persistFeaturedImage({ url, ...(meta || {}) });
                                toast.success("Featured image set!");
                            }} />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showImageSearch && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md" onClick={() => setShowImageSearch(false)}>
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-text-1">Insert Image</h3>
                                {imageSearchQuery ? (
                                    <p className="text-sm text-text-3 mt-1">Suggested: <span className="text-gold font-semibold">"{imageSearchQuery}"</span></p>
                                ) : (
                                    <p className="text-sm text-text-3 mt-1">Search and insert images into your article</p>
                                )}
                            </div>
                            <button 
                                onClick={() => setShowImageSearch(false)} 
                                className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-3 hover:text-text-1 transition-all active:scale-95"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <UnsplashSearch
                                initialQuery={imageSearchQuery}
                                onSelectImage={(url, attr) => {
                                    const html = `<p><img src="${url}" alt="${imageSearchSection || 'Image'}"></p><p><em>${attr}</em></p>`;
                                    if (editorRef.current && viewMode === "edit") {
                                        editorRef.current.insertContent(html);
                                    } else {
                                        const md = `\n\n![${imageSearchSection || "Image"}](${url})\n*${attr}*\n\n`;
                                        setContent((c) => c + md);
                                    }
                                    setShowImageSearch(false);
                                    toast.success("Image inserted!");
                                }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </motion.div>
    );
}
