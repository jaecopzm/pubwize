"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Custom SVG Icons
const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const EmailIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
    </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
    </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20,6 9,17 4,12"/>
    </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
        <polyline points="16,6 12,2 8,6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9,18 15,12 9,6"/>
    </svg>
);

interface SocialAssets {
    twitterThread: string[];
    linkedinPost: string;
    emailNewsletter: string;
}

interface RepurposeButtonProps {
    articleId: string;
    articleTitle?: string;
    disabled?: boolean;
    existingAssets?: SocialAssets | null;
}

// Character limits for each platform
const CHAR_LIMITS = {
    twitter: 280,
    linkedin: 3000,
    email: 1000
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard!");
    };
    return (
        <button
            onClick={handleCopy}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 shrink-0"
            title="Copy to clipboard"
        >
            {copied ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <CopyIcon className="h-4 w-4" />}
        </button>
    );
}

function CharacterCount({ text, limit, className }: { text: string; limit: number; className?: string }) {
    const count = text.length;
    const isOverLimit = count > limit;
    const percentage = (count / limit) * 100;
    
    return (
        <div className={cn("flex items-center gap-2 text-xs", className)}>
            <div className="relative h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        percentage < 80 ? "bg-emerald-500" : 
                        percentage < 95 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className={cn(
                "font-mono tabular-nums",
                isOverLimit ? "text-red-500" : "text-muted-foreground"
            )}>
                {count}/{limit}
            </span>
        </div>
    );
}

export function RepurposeButton({
    articleId,
    articleTitle,
    disabled,
    existingAssets,
}: RepurposeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<"twitter" | "linkedin" | "email">("twitter");
    const [assets, setAssets] = useState<SocialAssets | null>(existingAssets || null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Close on Escape
            if (e.key === "Escape") {
                setIsOpen(false);
            }
            // Copy on Cmd/Ctrl + C
            if ((e.metaKey || e.ctrlKey) && e.key === "c" && assets) {
                e.preventDefault();
                let textToCopy = "";
                if (activeTab === "twitter") {
                    textToCopy = assets.twitterThread.join("\n\n");
                } else if (activeTab === "linkedin") {
                    textToCopy = assets.linkedinPost;
                } else {
                    textToCopy = assets.emailNewsletter;
                }
                navigator.clipboard.writeText(textToCopy);
                toast.success("Copied to clipboard!");
            }
            // Switch tabs with arrow keys
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const tabs = ["twitter", "linkedin", "email"] as const;
                const currentIndex = tabs.indexOf(activeTab);
                if (e.key === "ArrowLeft") {
                    setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
                } else {
                    setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, activeTab, assets]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch("/api/articles/repurpose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to generate social assets.");
            }
            const data = await response.json();
            setAssets(data.socialAssets);
            toast.success("Social assets generated!");
        } catch (error: any) {
            toast.error(error.message || "An error occurred.");
        } finally {
            setGenerating(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        // If we have existing assets, show them immediately
        if (existingAssets) {
            setAssets(existingAssets);
        }
    };

    const tabs = [
        { id: "twitter" as const, label: "Twitter", icon: TwitterIcon, color: "text-sky-400" },
        { id: "linkedin" as const, label: "LinkedIn", icon: LinkedInIcon, color: "text-blue-500" },
        { id: "email" as const, label: "Email", icon: EmailIcon, color: "text-amber-500" },
    ];

    const modalContent = isOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal — Large centered */}
            <div 
                className="relative z-[10000] w-full max-w-4xl h-[85vh] rounded-2xl border border-white/10 bg-surface-1 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                        <div className="absolute inset-0 bg-gradient-to-br from-lilac/10 via-transparent to-blue-500/5 pointer-events-none" />
                        
                        {/* Header */}
                        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5 bg-surface-1/50 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac via-lilac/80 to-purple-500 text-white shadow-lg shadow-lilac/30">
                                    <ShareIcon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-display font-black text-foreground text-xl mb-0.5">Repurpose Content</h2>
                                    {articleTitle && (
                                        <p className="text-xs font-medium text-muted-foreground truncate max-w-md">{articleTitle}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground hidden sm:block">
                                    <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono">ESC</kbd> to close
                                    {assets && <> · <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono">⌘C</kbd> to copy</>}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body — scrollable */}
                        <div className="relative flex-1 overflow-y-auto">
                            {!assets ? (
                                <div className="flex items-center justify-center h-full p-8">
                                    <div className="text-center max-w-md">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-lilac/20 to-purple-500/10 mx-auto mb-6 border border-lilac/20">
                                            <SparklesIcon className="h-10 w-10 text-lilac" />
                                        </div>
                                        <h3 className="font-display font-bold text-foreground mb-3 text-xl">
                                            Generate Social Media Assets
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                                            Transform your article into engaging content for Twitter, LinkedIn, and email newsletters. AI will craft platform-optimized posts in seconds.
                                        </p>
                                        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                                            {tabs.map((tab) => (
                                                <div key={tab.id} className="flex items-center gap-2">
                                                    <tab.icon className={cn("h-5 w-5", tab.color)} />
                                                    <span className="font-medium">{tab.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            className="btn-gold flex items-center gap-2.5 mx-auto px-6 py-3 text-base font-bold"
                                        >
                                            {generating ? (
                                                <><LoaderIcon className="h-5 w-5" /> Generating...</>
                                            ) : (
                                                <><SparklesIcon className="h-5 w-5" /> Generate Assets <ChevronRightIcon className="h-5 w-5" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6">
                                    {/* Tab Bar */}
                                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/50 border border-border mb-6">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200",
                                                    activeTab === tab.id
                                                        ? "bg-card text-foreground shadow-md border border-border scale-105"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <tab.icon className={cn("h-5 w-5 transition-colors", activeTab === tab.id ? tab.color : "")} />
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content Area */}
                                    <div className="min-h-[400px] transition-all duration-300">
                                        {/* Twitter Thread */}
                                        {activeTab === "twitter" && (
                                            <div className="space-y-3">
                                                {assets.twitterThread.map((tweet, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:border-sky-400/30 transition-colors"
                                                    >
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-400 text-sm font-bold">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <p className="text-sm text-foreground leading-relaxed">{tweet}</p>
                                                            <CharacterCount text={tweet} limit={CHAR_LIMITS.twitter} />
                                                        </div>
                                                        <CopyButton text={tweet} />
                                                    </div>
                                                ))}
                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(assets.twitterThread.join("\n\n")); toast.success("Thread copied!"); }}
                                                        className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-4 py-2 transition-all flex items-center gap-2 font-medium"
                                                    >
                                                        <CopyIcon className="h-4 w-4" /> Copy All Tweets
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* LinkedIn Post */}
                                        {activeTab === "linkedin" && (
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <div className="p-5 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[300px]">
                                                        {assets.linkedinPost}
                                                    </div>
                                                    <div className="absolute top-4 right-4">
                                                        <CopyButton text={assets.linkedinPost} />
                                                    </div>
                                                </div>
                                                <CharacterCount text={assets.linkedinPost} limit={CHAR_LIMITS.linkedin} className="justify-end" />
                                            </div>
                                        )}

                                        {/* Email Newsletter */}
                                        {activeTab === "email" && (
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <div className="p-5 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[300px]">
                                                        {assets.emailNewsletter}
                                                    </div>
                                                    <div className="absolute top-4 right-4">
                                                        <CopyButton text={assets.emailNewsletter} />
                                                    </div>
                                                </div>
                                                <CharacterCount text={assets.emailNewsletter} limit={CHAR_LIMITS.email} className="justify-end" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-border">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-4 py-2.5 transition-all font-medium hover:border-lilac/40"
                                        >
                                            {generating ? <LoaderIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="btn-primary px-5 py-2.5"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
    ) : null;

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpen();
                }}
                disabled={disabled}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-lilac/20 bg-lilac/5 text-lilac hover:bg-lilac/10 hover:border-lilac/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-sm shadow-lilac/5"
                title="Repurpose to social media"
            >
                <ShareIcon className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                <span>Repurpose</span>
                {existingAssets && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" title="Previously generated" />
                )}
            </button>

            {mounted && modalContent && createPortal(modalContent, document.body)}
        </>
    );
}
