"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Check, List, Loader2, FileCode, Sparkles, Zap, Edit3, Eye, CheckCircle2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateCTA } from "./shared-ui";
import { GenerationLoader } from "@/components/generation-loader";
import { UnsplashSearch } from "@/components/unsplash-search";
import { RichEditor, type RichEditorRef } from "./rich-editor";
import { WordCountRing } from "./word-count-ring";
import { SEOCommandCenter } from "./seo-command-center";
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="w-full h-auto rounded-2xl border border-white/10 shadow-2xl my-8">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 underline">$1</a>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-8 mb-4 text-text-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-text-1">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-black mt-12 mb-6 text-text-1">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`(.+?)`/g, '<code class="bg-surface-3 px-1.5 py-0.5 rounded font-mono text-teal text-sm">$1</code>')
    .replace(/^[-*+] (.+)$/gm, '<li class="mb-2">$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-6 mb-6">$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li class="mb-2">$1</li>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hpuo])(.+)$/gm, '<p class="mb-6 leading-relaxed text-text-2">$1</p>')
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
    onGenerateSocial,
    onPublish,
    loading,
    done,
    hasSeoData,
    targetWordCount,
    streaming = false,
    onUpgradeRequired,
    brief,
    socialLoading,
    featuredImageUrl,
    onFeaturedImageChange,
}: {
    draft: DraftData;
    keyword: string;
    articleId: string;
    siteDomain?: string;
    onGenerate?: () => void;
    onOptimize: () => void;
    onGenerateSocial?: () => void;
    onPublish?: () => void;
    loading: boolean;
    done: boolean;
    hasSeoData?: boolean;
    targetWordCount?: number;
    streaming?: boolean;
    onUpgradeRequired?: (reason: string) => void;
    brief?: any;
    socialLoading?: boolean;
    featuredImageUrl?: string | null;
    onFeaturedImageChange?: (img: { url: string; photographer?: string; photographerUrl?: string; unsplashId?: string } | null) => void;
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
    useEffect(() => {
        if (streaming && draft.content !== undefined && draft.content !== lastDraftContentRef.current) {
            lastDraftContentRef.current = draft.content;
            setContent(draft.content);
        }
    }, [streaming, draft.content]);

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
        setStreamContent("");

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

    return (
        <div className="w-full space-y-3">
                <SEOCommandCenter
                    content={displayContent}
                    keyword={keyword}
                    targetWordCount={targetWordCount ?? 2000}
                    onUpdate={setContent}
                />

                {/* Stats Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {/* Word Count Ring */}
                    <div className="shrink-0">
                        <WordCountRing current={currentWordCount} target={targetWordCount ?? 2000} size={56} streaming={isAnyStreaming} />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                        {/* Words */}
                        <div className="relative overflow-hidden rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/5 p-2.5">
                            {isAnyStreaming && <div className="absolute inset-0 bg-[#6366f1]/10 animate-pulse" />}
                            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Words</div>
                            <div className="text-sm font-black text-[#818cf8] relative z-10 tabular-nums">
                                {currentWordCount.toLocaleString()}
                                <span className="text-[9px] text-[#6366f1]/50 ml-0.5">/{targetWordCount}</span>
                            </div>
                        </div>
                        {/* Read time */}
                        <div className="relative overflow-hidden rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 p-2.5">
                            {isAnyStreaming && <div className="absolute inset-0 bg-[#22d3ee]/10 animate-pulse" />}
                            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Read</div>
                            <div className="text-sm font-black text-[#22d3ee] relative z-10">{Math.ceil(currentWordCount / 200)}<span className="text-[9px] text-[#22d3ee]/50"> min</span></div>
                        </div>
                        {/* Headings */}
                        <div className="rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-2.5">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Headings</div>
                            <div className="text-sm font-black text-[#a78bfa]">{headings.length}</div>
                        </div>
                    </div>
                </div>

                {/* SEO Metadata */}
                {brief && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                        <h4 className="text-xs font-semibold text-text-1 mb-2">SEO Metadata</h4>
                        <div className="space-y-2">
                            {/* Meta Title */}
                            <div>
                                <label className="text-[10px] text-text-3 mb-1 block">Meta Title</label>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-2/50 border border-white/5">
                                    <input
                                        type="text"
                                        value={`${keyword} - Complete Guide 2026`}
                                        readOnly
                                        className="flex-1 bg-transparent text-xs text-text-2 outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${keyword} - Complete Guide 2026`);
                                            toast.success("Title copied!");
                                        }}
                                        className="p-1 rounded hover:bg-white/5"
                                    >
                                        <Copy className="h-3 w-3 text-text-3" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Meta Description */}
                            <div>
                                <label className="text-[10px] text-text-3 mb-1 block">Meta Description</label>
                                <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-2/50 border border-white/5">
                                    <textarea
                                        value={`Discover everything about ${keyword}. Expert insights, practical tips, and comprehensive guide to help you master ${keyword} in 2026.`}
                                        readOnly
                                        rows={2}
                                        className="flex-1 bg-transparent text-xs text-text-2 outline-none resize-none"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`Discover everything about ${keyword}. Expert insights, practical tips, and comprehensive guide to help you master ${keyword} in 2026.`);
                                            toast.success("Description copied!");
                                        }}
                                        className="p-1 rounded hover:bg-white/5 shrink-0"
                                    >
                                        <Copy className="h-3 w-3 text-text-3" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Keywords */}
                            {brief.entities && brief.entities.length > 0 && (
                                <div>
                                    <label className="text-[10px] text-text-3 mb-1 block">Keywords</label>
                                    <div className="flex flex-wrap gap-1">
                                        {brief.entities.slice(0, 8).map((entity: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(entity);
                                                    toast.success("Keyword copied!");
                                                }}
                                                className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                                            >
                                                {entity}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Featured Image */}
                <div className="rounded-xl border border-white/10 bg-surface-1 p-4 sm:p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-sm sm:text-base font-bold text-text-1 flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-gold animate-pulse" />
                                Featured Image
                            </h4>
                            <p className="text-xs text-text-3 mt-1">Hero image for your article</p>
                        </div>
                        <button
                            onClick={() => setShowFeaturedImageSearch(true)}
                            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold px-3 py-2 text-xs font-bold text-obsidian hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 hover:shadow-gold/30 active:scale-95"
                        >
                            <Download className="h-3.5 w-3.5" />
                            {featuredImage ? "Change" : "Select Image"}
                        </button>
                    </div>
                    {featuredImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-xl group">
                            <img src={featuredImage} alt="Featured" className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                                onClick={() => {
                                    setFeaturedImage(null);
                                    persistFeaturedImage(null);
                                }}
                                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/90 backdrop-blur-sm text-white border border-red-400/30 hover:bg-red-500 transition-all shadow-lg active:scale-95"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-white/10 bg-surface-2/50 p-8 sm:p-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                                    <Download className="h-6 w-6 text-gold" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-2">No image selected</p>
                                    <p className="text-xs text-text-3 mt-1">Click "Select Image" to browse Unsplash</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toolbar Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-3/50 border border-white/5">
                        <button
                            onClick={() => setViewMode("edit")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                viewMode === "edit" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-text-3 hover:text-text-2"
                            )}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                viewMode === "preview" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-text-3 hover:text-text-2"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStructure(!showStructure)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                showStructure
                                    ? "border-[#6366f1]/40 bg-[#6366f1]/10 text-[#818cf8]"
                                    : "border-border text-muted-foreground hover:border-[#6366f1]/30 hover:text-foreground"
                            }`}
                        >
                            <List className="h-3.5 w-3.5" />
                            Structure
                        </button>
                        <button
                            onClick={() => setShowImageSearch(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-[#22d3ee]/30 hover:text-[#22d3ee] transition-all"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Add Image
                        </button>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        {/* Auto-save indicator */}
                        {isSaving ? (
                            <span className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20 px-2.5 py-1 text-[10px] font-semibold text-[#818cf8]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving…
                            </span>
                        ) : lastSaved ? (
                            <span className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        ) : null}
                        <button
                            onClick={() => handleSaveContent()}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-3 py-1.5 text-xs font-bold text-[#818cf8] hover:bg-[#6366f1]/20 disabled:opacity-50 transition-all active:scale-95"
                        >
                            <Check className="h-3 w-3" />
                            Save
                        </button>
                    </div>
                </div>

                {/* AI tip banner */}
                <div className="flex items-center gap-2 rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/5 px-3 py-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#818cf8] shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Tip:</strong> Select any text to get instant AI actions — rewrite, shorten, expand, or change tone.
                    </p>
                </div>

                {/* Structure Panel */}
                {showStructure && headings.length > 0 && (
                    <div className="rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/5 p-4">
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wider mb-3 text-[#818cf8]">Article Structure</h4>
                        <div className="space-y-0.5 max-h-56 overflow-y-auto">
                            {headings.map((h, i) => {
                                const level = h.match(/^#+/)?.[0].length ?? 2;
                                const text = h.replace(/^#+\s+/, "");
                                return (
                                    <div key={i} className="text-xs py-1 text-foreground/70 truncate hover:text-foreground transition-colors"
                                        style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                                        <span className="text-[#6366f1]/50 mr-1.5 font-mono">H{level}</span>
                                        {text}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* ── Rich Text Editor / Preview ── */}
                <div className="rounded-xl border border-white/8 bg-surface-2/50 p-3 sm:p-4 relative min-h-[500px]">
                    {(isAnyStreaming || loading) && !displayContent && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2/90 backdrop-blur-sm rounded-xl">
                            <GenerationLoader step="draft" message={isAnyStreaming ? "Writing your article..." : "Drafting your article..."} keyword={keyword} />
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="prose prose-invert prose-indigo max-w-none 
                                     prose-headings:font-black prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl
                                     prose-p:text-text-2 prose-p:leading-relaxed prose-p:text-base
                                     prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(displayContent) }}
                        />
                    )}
                </div>

                {/* Export */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button onClick={() => exportContent("html")} className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-gold hover:bg-gold/10 transition-colors">
                        <FileCode className="h-3 w-3 shrink-0" /> 
                        <span className="hidden sm:inline">Copy HTML</span>
                        <span className="sm:hidden">HTML</span>
                    </button>
                    <button onClick={() => exportContent("wp")} className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-teal hover:bg-teal/10 transition-colors">
                        <Copy className="h-3 w-3 shrink-0" /> 
                        <span className="hidden sm:inline">Copy for WordPress</span>
                        <span className="sm:hidden">WP</span>
                    </button>
                    <button onClick={() => exportContent("docx")} className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-gold hover:bg-gold/10 transition-colors">
                        <Download className="h-3 w-3 shrink-0" /> 
                        <span className="hidden sm:inline">Download DOCX</span>
                        <span className="sm:hidden">DOCX</span>
                    </button>
                </div>

                {/* Featured Image Modal */}
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

                {/* Image Insert Modal */}
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

                {/* Action Buttons */}
                {!streaming && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {onGenerateSocial && (
                            <button
                                onClick={onGenerateSocial}
                                disabled={socialLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {socialLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                                {socialLoading ? "Generating..." : "Generate Social Posts"}
                            </button>
                        )}
                        {onPublish && siteDomain && (
                            <button
                                onClick={onPublish}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal bg-teal/10 text-teal font-semibold hover:bg-teal/20 transition-colors"
                            >
                                <Zap className="h-4 w-4" />
                                Publish to WordPress
                            </button>
                        )}
                    </div>
                )}
        </div>
    );
}
