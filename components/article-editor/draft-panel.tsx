"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Copy, Download, Check, List, Loader2, FileCode, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { getFirebaseAuth } from "@/lib/firebase-client";
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
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Not authenticated");

            const res = await fetch("/api/articles/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
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
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Unable to get ID token");

            const res = await fetch(`/api/articles/${articleId}/content`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
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

    return (
        <div className="w-full space-y-3 sm:space-y-4">
                {/* Stats Bar */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
                    {/* Word Count Ring */}
                    <div className="shrink-0">
                        <WordCountRing current={currentWordCount} target={targetWordCount ?? 2000} size={56} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5 sm:gap-2 min-w-0">
                        <div className="rounded-lg border border-teal/20 bg-teal/5 p-2 sm:p-2.5 relative overflow-hidden group">
                            {isStreaming && <div className="absolute inset-0 bg-teal/10 animate-pulse" />}
                            <div className="text-[9px] sm:text-[10px] font-mono-dm mb-0.5 text-text-3 relative z-10">Live Words</div>
                            <div className="text-sm sm:text-base font-bold font-mono-dm text-teal relative z-10">
                                {currentWordCount.toLocaleString()} <span className="text-[8px] sm:text-[9px] text-teal/50">/ {targetWordCount}</span>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gold/20 bg-gold/5 p-2 sm:p-2.5 relative">
                            {isStreaming && <div className="absolute inset-0 bg-gold/10 animate-pulse" />}
                            <div className="text-[9px] sm:text-[10px] font-mono-dm mb-0.5 text-text-3 relative z-10">Read Time</div>
                            <div className="text-sm sm:text-base font-bold font-mono-dm text-gold relative z-10">{Math.ceil(currentWordCount / 200)} min</div>
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStructure(!showStructure)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${showStructure ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-text-3 hover:text-text-2"
                                }`}
                        >
                            <List className="h-3.5 w-3.5" />
                            Structure
                        </button>
                        <button
                            onClick={() => setShowImageSearch(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-text-3 hover:text-text-2 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Add Image
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSaving ? (
                            <span className="flex items-center gap-1.5 text-xs text-teal">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving...
                            </span>
                        ) : lastSaved ? (
                            <span className="text-[10px] text-text-3">
                                Saved {lastSaved.toLocaleTimeString()}
                                <span className="inline-block ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                            </span>
                        ) : null}
                        <button
                            onClick={() => handleSaveContent()}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10 disabled:opacity-50"
                        >
                            <Check className="h-3 w-3" />
                            Save
                        </button>
                    </div>
                </div>

                {/* AI tip banner */}
                <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                    <p className="text-[11px] text-text-3 leading-relaxed">
                        <strong className="text-text-2">Tip:</strong> Select any text to get instant AI actions — rewrite, shorten, expand, or change tone.
                    </p>
                </div>

                {/* Structure Panel */}
                {showStructure && headings.length > 0 && (
                    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
                        <h4 className="text-sm font-semibold font-mono-dm mb-3 text-gold">Article Structure</h4>
                        <div className="space-y-0.5 max-h-56 overflow-y-auto">
                            {headings.map((h, i) => {
                                const level = h.match(/^#+/)?.[0].length ?? 2;
                                const text = h.replace(/^#+\s+/, "");
                                return (
                                    <div
                                        key={i}
                                        className="text-xs py-1 text-text-2 truncate"
                                        style={{ paddingLeft: `${(level - 1) * 12}px` }}
                                    >
                                        <span className="text-text-3 mr-1">{"H".repeat(1) + level}</span>
                                        {text}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* ── Rich Text Editor ── */}
                <div className="rounded-xl border border-white/8 bg-surface-2/50 p-4 sm:p-6 relative">
                    {(isStreaming || loading) && !displayContent && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2/90 backdrop-blur-sm rounded-xl">
                            <GenerationLoader step="draft" message={isStreaming ? "Writing your article..." : "Drafting your article..."} keyword={keyword} />
                        </div>
                    )}
                    <RichEditor
                        value={displayContent}
                        onChange={setContent}
                        keyword={keyword}
                        articleId={articleId}
                        streaming={isStreaming || loading}
                        onUpgradeRequired={onUpgradeRequired}
                    />
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
