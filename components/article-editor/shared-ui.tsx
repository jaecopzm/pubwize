"use client";

import { useState } from "react";
import { Check, Copy, CheckCircle2, Loader2, Sparkles } from "lucide-react";

// ── Copy-to-clipboard button ─────────────────────────────────────────
export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md px-2 sm:px-2 py-1.5 sm:py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95 touch-manipulation"
        >
            {copied ? <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-green-400" /> : <Copy className="h-3.5 w-3.5 sm:h-3 sm:w-3" />}
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}

// ── Stat pill ────────────────────────────────────────────────────────
export function StatPill({ label, value }: { label: string; value: any }) {
    const renderStat = (val: any) => {
        if (typeof val === "object" && val !== null && "value" in val) return val.value;
        return val;
    };

    return (
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-border/60 bg-card px-2 sm:px-3 py-1">
            <span className="text-[10px] sm:text-xs font-semibold text-foreground">{renderStat(value)}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
        </div>
    );
}

export function GenerateCTA({
    onClick,
    loading,
    done,
    label,
    doneLabel,
    onRegenerate,
}: {
    onClick: () => void;
    loading: boolean;
    done: boolean;
    label: string;
    doneLabel: string;
    onRegenerate?: () => void;
}) {
    if (done)
        return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-semibold flex-1 text-emerald-400 shadow-sm shadow-emerald-500/5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{doneLabel}</span>
                </div>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="group relative flex items-center justify-center gap-2 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-3.5 text-sm font-semibold text-[#818cf8] transition-all hover:bg-[#6366f1]/20 hover:border-[#6366f1]/50 hover:shadow-lg hover:shadow-[#6366f1]/20 hover:-translate-y-0.5 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6366f1]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Sparkles className="h-4 w-4 shrink-0 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10">Regenerate</span>
                    </button>
                )}
            </div>
        );

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6366f1]/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all hover:scale-[1.01] hover:shadow-[#6366f1]/40 active:scale-[0.99]"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            {loading ? (
                <div className="flex flex-col items-center gap-1.5 relative z-10 w-full px-8">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Working on it...</span>
                    </div>
                    {/* Subtle progress bar inside button */}
                    <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden mt-1">
                        <div className="h-full bg-white/60 animate-progress-indefinite rounded-full" />
                    </div>
                </div>
            ) : (
                <>
                    <Sparkles className="h-4 w-4 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10">{label}</span>
                </>
            )}
        </button>
    );
}
