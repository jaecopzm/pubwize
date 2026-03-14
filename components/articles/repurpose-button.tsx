"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
    Twitter,
    Linkedin,
    Mail,
    Sparkles,
    Copy,
    CheckCheck,
    X,
    Loader2,
    Share2,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied!");
    };
    return (
        <button
            onClick={handleCopy}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
            title="Copy"
        >
            {copied ? <CheckCheck className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4" />}
        </button>
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

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const auth = getFirebaseAuth();
            const user = auth.currentUser;
            if (!user) { toast.error("You must be logged in."); return; }
            const token = await user.getIdToken();
            const response = await fetch("/api/articles/repurpose", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

    const tabs = [
        { id: "twitter" as const, label: "Twitter", icon: Twitter, color: "text-sky-400" },
        { id: "linkedin" as const, label: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
        { id: "email" as const, label: "Email", icon: Mail, color: "text-gold" },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-lilac/20 bg-lilac/5 text-lilac hover:bg-lilac/10 hover:border-lilac/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-sm shadow-lilac/5"
                title="Repurpose to social media"
            >
                <Share2 className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                <span>Repurpose</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-150">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal — slides up from bottom on mobile, centered on sm+ */}
                    <div className="relative z-10 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-white/10 bg-surface-1/90 backdrop-blur-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-lilac/5 to-transparent pointer-events-none" />
                        
                        {/* Header */}
                        <div className="relative flex items-center justify-between border-b border-white/5 p-4 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lilac/20 to-lilac/10 text-lilac border border-lilac/20 shadow-lg shadow-lilac/10">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-display font-black text-foreground text-base">Repurpose</h2>
                                    {articleTitle && (
                                        <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-widest truncate max-w-[180px] sm:max-w-xs">{articleTitle}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all touch-manipulation"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="p-4 overflow-y-auto flex-1">
                            {!assets ? (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac/10 mx-auto mb-4">
                                        <Sparkles className="h-7 w-7 text-lilac" />
                                    </div>
                                    <h3 className="font-display font-semibold text-foreground mb-2 text-sm sm:text-base">
                                        Generate Social Media Assets
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                                        AI will craft a Twitter thread, LinkedIn post, and email snippet from your article — all in one click.
                                    </p>
                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-5">
                                        {tabs.map((tab) => (
                                            <div key={tab.id} className="flex items-center gap-1.5">
                                                <tab.icon className={cn("h-3.5 w-3.5", tab.color)} />
                                                {tab.label}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        className="btn-gold flex items-center gap-2 mx-auto w-full sm:w-auto justify-center touch-manipulation"
                                    >
                                        {generating ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                                        ) : (
                                            <><Sparkles className="h-4 w-4" /> Generate Assets <ChevronRight className="h-4 w-4" /></>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Tab Bar */}
                                    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation",
                                                    activeTab === tab.id
                                                        ? "bg-card text-foreground shadow-sm border border-border"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <tab.icon className={cn("h-3.5 w-3.5 shrink-0", tab.color)} />
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Twitter Thread */}
                                    {activeTab === "twitter" && (
                                        <div className="space-y-2">
                                            {assets.twitterThread.map((tweet, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-background"
                                                >
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-400 text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <p className="flex-1 text-sm text-foreground leading-relaxed">{tweet}</p>
                                                    <CopyButton text={tweet} />
                                                </div>
                                            ))}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(assets.twitterThread.join("\n\n")); toast.success("Thread copied!"); }}
                                                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 touch-manipulation"
                                                >
                                                    <Copy className="h-3 w-3" /> Copy All Tweets
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* LinkedIn Post */}
                                    {activeTab === "linkedin" && (
                                        <div className="relative">
                                            <div className="p-4 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-10">
                                                {assets.linkedinPost}
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <CopyButton text={assets.linkedinPost} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Newsletter */}
                                    {activeTab === "email" && (
                                        <div className="relative">
                                            <div className="p-4 rounded-xl border border-border bg-background text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-10">
                                                {assets.emailNewsletter}
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <CopyButton text={assets.emailNewsletter} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Regenerate */}
                                    <div className="flex justify-end pt-1">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-all touch-manipulation"
                                        >
                                            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                            Regenerate
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
