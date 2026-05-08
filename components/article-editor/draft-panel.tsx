"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Copy, Download, Check, List, Loader2, FileCode, Sparkles, Zap, Edit3, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateCTA } from "./shared-ui";
import { GenerationLoader } from "@/components/generation-loader";
import { UnsplashSearch } from "@/components/unsplash-search";
import { RichEditor } from "./rich-editor";
import { PublishChecklist } from "./publish-checklist";
import { WordCountRing } from "./word-count-ring";
import { SEOCommandCenter } from "./seo-command-center";
import type { DraftData } from "@/lib/types";

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
        .replace(/`{3}[\s\S]*?`{3}/g, "")
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
  return md
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
    loading,
    done,
    hasSeoData,
    targetWordCount,
    streaming = false,
    onUpgradeRequired,
}: {
    draft: DraftData;
    keyword: string;
    articleId: string;
    siteDomain?: string;
    onGenerate?: () => void;
    onOptimize: () => void;
    loading: boolean;
    done: boolean;
    hasSeoData?: boolean;
    targetWordCount?: number;
    streaming?: boolean;
    onUpgradeRequired?: (reason: string) => void;
}) {
    const [content, setContent] = useState(draft.content);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [showFeaturedImageSearch, setShowFeaturedImageSearch] = useState(false);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [showStructure, setShowStructure] = useState(false);
    const [imageSearchQuery, setImageSearchQuery] = useState("");
    const [imageSearchSection, setImageSearchSection] = useState("");
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState("");
    const streamAbortRef = useRef<AbortController | null>(null);

    // ── Word count ───────────────────────────────────────────────────
    useEffect(() => {
        const plainText = stripMarkdown(content);
        const words = plainText.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setWordCount(words);
    }, [content]);

    // ── Headings for structure ───────────────────────────────────────
    const headings = useMemo(() => content.match(/^#{1,6}\s+.+$/gm) || [], [content]);

    // ── Sync external draft content when streaming from parent page ─
    useEffect(() => {
        if (streaming && draft.content !== undefined) {
            setContent(draft.content);
        }
    }, [streaming, draft.content]);

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
                            setStreamContent(accumulatedContent);
                        }
                        if (payload.done) {
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

    // The displayed content — streaming takes priority while active
    const displayContent = isStreaming ? streamContent : content;
    const currentWordCount = displayContent.split(/\s+/).filter(Boolean).length;
    const isAnyStreaming = isStreaming || streaming;

    return (
        <div className="w-full space-y-3 sm:space-y-4">
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

                {/* Featured Image */}
                <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold font-mono-dm mb-0.5 text-text-1">Featured Image</h4>
                            <p className="text-[10px] sm:text-xs text-text-3">Hero image for your article</p>
                        </div>
                        <button
                            onClick={() => setShowFeaturedImageSearch(true)}
                            className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10 transition-colors"
                        >
                            <Download className="h-3 w-3" />
                            {featuredImage ? "Change" : "Select"}
                        </button>
                    </div>
                    {featuredImage && (
                        <div className="mt-3 relative rounded-lg overflow-hidden">
                            <img src={featuredImage} alt="Featured" className="w-full h-32 sm:h-48 object-cover" />
                            <button
                                onClick={() => setFeaturedImage(null)}
                                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold bg-black/70 text-white"
                            >
                                Remove
                            </button>
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
                <div className="rounded-xl border border-white/8 bg-surface-2/50 p-4 sm:p-6 relative min-h-[600px]">
                    {(isAnyStreaming || loading) && !displayContent && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2/90 backdrop-blur-sm rounded-xl">
                            <GenerationLoader step="draft" message={isAnyStreaming ? "Writing your article..." : "Drafting your article..."} keyword={keyword} />
                        </div>
                    )}
                    
                    {viewMode === "edit" ? (
                        <RichEditor
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

                {/* Publish Checklist */}
                <PublishChecklist
                    wordCount={wordCount}
                    featuredImage={featuredImage}
                    hasSeoData={hasSeoData ?? false}
                    targetWordCount={targetWordCount}
                />

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
                {showFeaturedImageSearch && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={() => setShowFeaturedImageSearch(false)}>
                        <div className="w-full max-w-4xl rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 my-4 sm:my-8" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-text-1">Select Featured Image</h3>
                                <button onClick={() => setShowFeaturedImageSearch(false)} className="text-xl sm:text-2xl text-text-3">×</button>
                            </div>
                            <UnsplashSearch onSelectImage={(url) => { setFeaturedImage(url); setShowFeaturedImageSearch(false); toast.success("Featured image set!"); }} />
                        </div>
                    </div>
                )}

                {/* Image Insert Modal */}
                {showImageSearch && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={() => setShowImageSearch(false)}>
                        <div className="w-full max-w-4xl rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 my-4 sm:my-8" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between mb-3 sm:mb-4">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-text-1">Insert Image</h3>
                                    {imageSearchQuery && <p className="text-xs text-text-3">Suggested: "{imageSearchQuery}"</p>}
                                </div>
                                <button onClick={() => setShowImageSearch(false)} className="text-xl sm:text-2xl text-text-3">×</button>
                            </div>
                            <UnsplashSearch
                                initialQuery={imageSearchQuery}
                                onSelectImage={(url, attr) => {
                                    const md = `\n\n![${imageSearchSection || "Image"}](${url})\n*${attr}*\n\n`;
                                    setContent((c) => c + md);
                                    setShowImageSearch(false);
                                    toast.success("Image inserted!");
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Generate / Optimize CTA */}
                {loading ? (
                    <GenerationLoader step="optimize" message="Optimizing your article..." keyword={keyword} />
                ) : (
                    <div className="pt-1 w-full">
                        <GenerateCTA
                            onClick={onOptimize}
                            loading={loading}
                            done={done}
                            label="Run SEO Analysis →"
                            doneLabel="SEO Analysis Complete"
                            onRegenerate={done ? onOptimize : undefined}
                        />
                    </div>
                )}
        </div>
    );
}
