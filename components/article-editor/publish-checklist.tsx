"use client";

import { useMemo } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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
            detail: `${wordCount.toLocaleString()} words`,
            pass: wordCount >= targetWordCount,
            warn: wordCount >= targetWordCount * 0.8 && wordCount < targetWordCount,
        },
        {
            label: "Featured image set",
            detail: featuredImage ? "Image selected" : "No image",
            pass: !!featuredImage,
            warn: false,
        },
        {
            label: "SEO analysis complete",
            detail: hasSeoData ? "Title & meta ready" : "Run SEO analysis first",
            pass: hasSeoData,
            warn: false,
        },
    ], [wordCount, featuredImage, hasSeoData, targetWordCount]);

    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;
    const allGreen = passed === total;
    const scorePercent = Math.round((passed / total) * 100);

    return (
        <div className={`rounded-xl border p-4 transition-all ${allGreen
                ? "border-teal/30 bg-teal/5"
                : passed >= 3
                    ? "border-gold/30 bg-gold/5"
                    : "border-white/10 bg-white/3"
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${allGreen ? "bg-teal animate-pulse" : passed >= 3 ? "bg-gold" : "bg-white/30"}`} />
                    <h4 className="text-xs font-semibold font-mono-dm text-text-1">Publish Checklist</h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono-dm ${allGreen ? "text-teal" : passed >= 3 ? "text-gold" : "text-text-3"}`}>
                        {passed}/{total}
                    </span>
                    {/* Mini progress bar */}
                    <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${scorePercent}%`,
                                background: allGreen ? "var(--teal)" : passed >= 3 ? "var(--gold)" : "rgba(255,255,255,0.3)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Checks */}
            <div className="space-y-1.5">
                {checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        {check.pass ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" />
                        ) : check.warn ? (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-gold" />
                        ) : (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        )}
                        <span className={`text-[11px] flex-1 ${check.pass ? "text-text-2" : check.warn ? "text-gold" : "text-text-3"}`}>
                            {check.label}
                        </span>
                        <span className="text-[10px] text-text-3 shrink-0">{check.detail}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            {allGreen && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready to publish!
                </div>
            )}
            {!allGreen && (
                <p className="mt-2.5 text-[10px] text-text-3">
                    Fix the items above before publishing for best results.
                </p>
            )}
        </div>
    );
}
