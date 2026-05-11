"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Quality Suggestions */}
            <WorkflowSuggestions step="brief" data={brief} />
            
            {/* Intent & Type badges */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 dark:border-cyan-400/20 bg-cyan-500/5 dark:bg-cyan-400/5 px-2.5 py-1 shadow-sm">
                    <Zap className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Intent: {brief.intent || 'Informational'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 px-2.5 py-1 shadow-sm">
                    <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Type: {brief.articleType || 'Guide'}
                    </span>
                </div>
                <button
                    onClick={exportBrief}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 shadow-sm"
                >
                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                {/* Headings */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3 sm:space-y-4"
                >
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-indigo-500" />
                        <span>Suggested Headings</span>
                        <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">
                            {brief.headings.length}
                        </span>
                    </h3>
                    <ul className="space-y-1.5">
                        {brief.headings.map((h, i) => (
                            <motion.li 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.05) }}
                                className="group flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-all hover:bg-accent hover:border-accent-foreground/20 shadow-sm"
                            >
                                <span className="mt-0.5 shrink-0 font-mono text-[9px] font-bold text-muted-foreground uppercase">H{i === 0 ? 1 : 2}</span>
                                <span className="flex-1 font-medium leading-relaxed text-foreground">{h}</span>
                                <button
                                    onClick={() => copyToClipboard(h, i)}
                                    className="p-1 rounded-md bg-muted/50 hover:bg-muted active:scale-95 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    {copiedIndex === i ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* Questions */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3 sm:space-y-4"
                >
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                        <span>People Also Ask</span>
                        <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">
                            {brief.questions.length}
                        </span>
                    </h3>
                    <ul className="space-y-1.5">
                        {brief.questions.map((q, i) => (
                            <motion.li 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.05) }}
                                className="group flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-all hover:bg-accent hover:border-accent-foreground/20 shadow-sm"
                            >
                                <span className="mt-0.5 shrink-0 font-mono text-[9px] font-bold text-cyan-600 dark:text-cyan-400">{i + 1}</span>
                                <span className="flex-1 font-medium leading-relaxed text-foreground">{q}</span>
                                <button
                                    onClick={() => copyToClipboard(q, i + 100)}
                                    className="p-1 rounded-md bg-muted/50 hover:bg-muted active:scale-95 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Copy question"
                                >
                                    {copiedIndex === i + 100 ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Strategic SEO Insights */}
            {(brief.eeatOpportunities?.length || brief.informationGain?.length) && (
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                    {/* EEAT Opportunities */}
                    {brief.eeatOpportunities && brief.eeatOpportunities.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="rounded-lg border border-cyan-500/20 dark:border-cyan-400/20 bg-cyan-500/5 dark:bg-cyan-400/5 p-4 shadow-sm"
                        >
                            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>EEAT Opportunities</span>
                            </h3>
                            <ul className="space-y-2">
                                {brief.eeatOpportunities.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                                        <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Information Gain / Unique Angles */}
                    {brief.informationGain && brief.informationGain.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="rounded-lg border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 p-4 shadow-sm"
                        >
                            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                <Zap className="h-3.5 w-3.5" />
                                <span>Information Gain</span>
                            </h3>
                            <ul className="space-y-2">
                                {brief.informationGain.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                                        <div className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 dark:border-indigo-400/30">
                                            <div className="h-1 w-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Entities */}
            {brief.entities?.length > 0 && (
                <div className="pt-3">
                    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        <span>Key Entities</span>
                        <div className="h-px flex-1 bg-border" />
                        <span className="font-mono text-[9px]">{brief.entities.length}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {brief.entities.map((e, i) => (
                            <motion.span 
                                key={i} 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + (i * 0.02) }}
                                className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-default"
                            >
                                {e}
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 w-full">
                <GenerateCTA
                    onClick={onGenerate}
                    loading={loading}
                    done={done}
                    label="Structure Outline"
                    doneLabel="Brief Finalized"
                    onRegenerate={done ? onGenerate : undefined}
                />
            </div>
        </motion.div>
    );
}
