"use client";

import { useMemo } from "react";
import { CheckCircle2, XCircle, AlertCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishChecklistProps {
    wordCount: number;
    featuredImage: string | null;
    hasSeoData: boolean;
    targetWordCount?: number;
}

export function PublishChecklist({
    wordCount,
    featuredImage,
    hasSeoData,
    targetWordCount = 1000,
}: PublishChecklistProps) {
    const checks = useMemo(() => [
        {
            label: `Word count ≥ ${targetWordCount.toLocaleString()}`,
            detail: `${wordCount.toLocaleString()} / ${targetWordCount.toLocaleString()}`,
            pass: wordCount >= targetWordCount,
            warn: wordCount >= targetWordCount * 0.8 && wordCount < targetWordCount,
        },
        {
            label: "Featured image set",
            detail: featuredImage ? "Image ready" : "None selected",
            pass: !!featuredImage,
            warn: false,
        },
        {
            label: "SEO analysis complete",
            detail: hasSeoData ? "Title & meta ready" : "Pending",
            pass: hasSeoData,
            warn: false,
        },
    ], [wordCount, featuredImage, hasSeoData, targetWordCount]);

    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;
    const allGreen = passed === total;
    const scorePercent = Math.round((passed / total) * 100);

    const borderColor = allGreen ? "border-emerald-500/30" : passed >= 2 ? "border-amber-500/20" : "border-white/8";
    const bgColor    = allGreen ? "bg-emerald-500/5"  : passed >= 2 ? "bg-amber-500/5"  : "bg-white/2";
    const barColor   = allGreen ? "#10b981" : passed >= 2 ? "#f59e0b" : "rgba(255,255,255,0.2)";

    return (
        <div className={cn("rounded-xl border p-4 transition-all duration-500", borderColor, bgColor)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full transition-colors duration-500",
                        allGreen ? "bg-emerald-500 animate-pulse" : passed >= 2 ? "bg-amber-500" : "bg-white/20")} />
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground">
                        Publish Checklist
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-black",
                        allGreen ? "text-emerald-500" : passed >= 2 ? "text-amber-500" : "text-muted-foreground")}>
                        {passed}/{total}
                    </span>
                    <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${scorePercent}%`, background: barColor }} />
                    </div>
                </div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
                {checks.map((check, i) => (
                    <div key={i} className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300",
                        check.pass ? "bg-emerald-500/10" : check.warn ? "bg-amber-500/10" : "bg-white/4"
                    )}>
                        <div className="shrink-0">
                            {check.pass ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                            ) : check.warn ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-white/20" />
                            )}
                        </div>
                        <span className={cn("text-[11px] flex-1 font-medium",
                            check.pass ? "text-foreground" : check.warn ? "text-amber-400" : "text-muted-foreground")}>
                            {check.label}
                        </span>
                        <span className={cn("text-[10px] font-mono shrink-0",
                            check.pass ? "text-emerald-500/70" : check.warn ? "text-amber-500/70" : "text-muted-foreground/50")}>
                            {check.detail}
                        </span>
                    </div>
                ))}
            </div>

            {/* Ready state */}
            {allGreen ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                    <Rocket className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-400">
                        Ready to publish! All checks passed.
                    </p>
                </div>
            ) : (
                <p className="mt-2.5 text-[10px] text-muted-foreground pl-1">
                    Complete the items above for best SEO results before publishing.
                </p>
            )}
        </div>
    );
}
