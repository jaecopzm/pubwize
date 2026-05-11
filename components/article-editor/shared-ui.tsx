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
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 shadow-xl hover:border-white/20 transition-all">
            <span className="text-[11px] sm:text-[13px] font-black text-white tabular-nums tracking-tight">{renderStat(value)}</span>
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-white/40">{label}</span>
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 dark:border-emerald-400/20 bg-emerald-500/5 dark:bg-emerald-400/5 px-4 py-2.5 text-sm font-semibold flex-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{doneLabel}</span>
                </div>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="group flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
                    >
                        <Sparkles className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-12" />
                        <span>Regenerate</span>
                    </button>
                )}
            </div>
        );

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4" />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}
