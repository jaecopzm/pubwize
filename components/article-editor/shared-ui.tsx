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

export { GenerateCTA } from "./generate-cta";
