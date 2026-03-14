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

// ── Generate CTA button ──────────────────────────────────────────────
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
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-teal/30 bg-teal/10 px-3 sm:px-5 py-2 sm:py-3.5 text-[10px] sm:text-sm font-semibold flex-1 text-teal">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{doneLabel}</span>
                </div>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="group relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gold/30 bg-gold/5 px-3 sm:px-4 py-2 sm:py-3.5 text-[10px] sm:text-sm font-semibold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 touch-manipulation overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10">Regenerate</span>
                    </button>
                )}
            </div>
        );

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="group relative w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gold/30 bg-gold px-3 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-sm font-semibold text-obsidian transition-all hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 active:scale-95 active:translate-y-0 touch-manipulation overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {loading ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin relative z-10" />
                    <span className="relative z-10">Generating…</span>
                </>
            ) : (
                <>
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10">{label}</span>
                </>
            )}
        </button>
    );
}
