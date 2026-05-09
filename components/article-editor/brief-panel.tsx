"use client";

import { useState } from "react";
import { Download, Check, Copy, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { GenerateCTA } from "./shared-ui";
import type { BriefData } from "@/lib/types";
import { WorkflowSuggestions } from "./workflow-suggestions";

export function BriefPanel({
    brief,
    onGenerate,
    loading,
    done,
    keyword,
    onUpdate,
    onUpgradeRequired,
}: {
    brief: BriefData;
    onGenerate: () => void;
    loading: boolean;
    done: boolean;
    keyword: string;
    onUpdate: (newBrief: BriefData) => void;
    onUpgradeRequired?: (reason: string) => void;
}) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const exportBrief = () => {
        const markdown = `# SEO Brief: ${brief.intent || 'Informational'}\n\n## Suggested Headings\n${brief.headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n## People Also Ask\n${brief.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n## Key Entities\n${brief.entities?.join(', ') || 'None'}`;
        navigator.clipboard.writeText(markdown);
        toast.success("Brief copied to clipboard!");
    };

    return (
        <div className="space-y-4">
            {/* Quality Suggestions */}
            <WorkflowSuggestions step="brief" data={brief} />
            
            {/* Intent & Type badges */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-gold bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                    Intent: {brief.intent || 'Informational'}
                </span>
                <span className="rounded-lg border border-teal bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">
                    Type: {brief.articleType || 'Guide'}
                </span>
                <button
                    onClick={exportBrief}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2 py-1 text-xs font-semibold text-gold transition-all hover:bg-gold/10 active:scale-95"
                >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Headings */}
                <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                        <span>Suggested Headings</span>
                        <span className="ml-auto text-xs font-normal text-text-3">
                            {brief.headings.length}
                        </span>
                    </h3>
                    <ul className="space-y-2">
                        {brief.headings.map((h, i) => (
                            <li key={i} className="group flex items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-all card-premium">
                                <span className="mt-0.5 shrink-0 text-xs text-text-3">H{i === 0 ? 1 : 2}</span>
                                <span className="flex-1 break-words text-text-2">{h}</span>
                                <button
                                    onClick={() => copyToClipboard(h, i)}
                                    className="p-1 rounded hover:bg-white/5 active:scale-95 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {copiedIndex === i ? (
                                        <Check className="h-3 w-3 text-teal" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-text-3" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-teal" />
                        <span>People Also Ask</span>
                        <span className="ml-auto text-xs font-normal text-text-3">
                            {brief.questions.length}
                        </span>
                    </h3>
                    <ul className="space-y-2">
                        {brief.questions.map((q, i) => (
                            <li key={i} className="group flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm transition-all card-premium">
                                <span className="mt-0.5 shrink-0 text-[10px] sm:text-xs font-semibold text-teal">{i + 1}.</span>
                                <span className="flex-1 break-words text-text-2">{q}</span>
                                <button
                                    onClick={() => copyToClipboard(q, i + 100)}
                                    className="p-1 rounded hover:bg-white/5 active:scale-95 touch-manipulation opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                    title="Copy question"
                                >
                                    {copiedIndex === i + 100 ? (
                                        <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-teal" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-text-3" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Strategic SEO Insights */}
            {(brief.eeatOpportunities?.length || brief.informationGain?.length) && (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 pt-2">
                    {/* EEAT Opportunities */}
                    {brief.eeatOpportunities && brief.eeatOpportunities.length > 0 && (
                        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 sm:p-5">
                            <h3 className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold font-mono-dm text-teal">
                                <ShieldCheck className="h-4 w-4" />
                                <span>EEAT Opportunities</span>
                            </h3>
                            <ul className="space-y-2">
                                {brief.eeatOpportunities.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] sm:text-xs text-text-2 leading-relaxed">
                                        <span className="mt-0.5 text-teal text-lg leading-none">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Information Gain / Unique Angles */}
                    {brief.informationGain && brief.informationGain.length > 0 && (
                        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 sm:p-5">
                            <h3 className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold font-mono-dm text-gold">
                                <Zap className="h-4 w-4" />
                                <span>Strategic Information Gain</span>
                            </h3>
                            <ul className="space-y-2">
                                {brief.informationGain.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] sm:text-xs text-text-2 leading-relaxed">
                                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full border border-gold/40 flex items-center justify-center">
                                            <div className="h-1 w-1 rounded-full bg-gold" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Entities */}
            {brief.entities?.length > 0 && (
                <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-semibold font-mono-dm text-text-1">
                        <span>Key Entities & Topics</span>
                        <span className="text-[9px] sm:text-[10px] font-normal text-text-3">
                            {brief.entities.length}
                        </span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {brief.entities.map((e, i) => (
                            <span key={i} className="badge-gold text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1">
                                {e}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-2 w-full">
                <GenerateCTA
                    onClick={onGenerate}
                    loading={loading}
                    done={done}
                    label="Generate Outline →"
                    doneLabel="Outline Generated"
                    onRegenerate={done ? onGenerate : undefined}
                />
            </div>
        </div>
    );
}
