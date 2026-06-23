"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Copy, Sparkles, Zap, ShieldCheck, HelpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { GenerateCTA } from "./shared-ui";
import { cn } from "@/lib/utils";
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
        toast.success("Copied to clipboard!");
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
                <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/10 dark:border-cyan-400/10 bg-cyan-500/5 dark:bg-cyan-400/5 px-3 py-1 shadow-sm">
                    <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Intent: {brief.intent || 'Informational'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/10 dark:border-indigo-400/10 bg-indigo-500/5 dark:bg-indigo-400/5 px-3 py-1 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Type: {brief.articleType || 'Guide'}
                    </span>
                </div>
                
                <button
                    onClick={exportBrief}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 shadow-sm"
                >
                    <Download className="h-3 w-3 mr-0.5" />
                    Export Brief
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Headings List (redesigned) */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3.5"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            <span>Suggested Outline Headings</span>
                        </h3>
                        <span className="font-mono text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                            {brief.headings.length} headings
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                        {brief.headings.map((h, i) => {
                            const isSub = i > 0 && (h.toLowerCase().includes("how") || h.toLowerCase().includes("what") || h.toLowerCase().includes("step") || h.toLowerCase().includes("tips") || h.toLowerCase().includes("best"));
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className={cn(
                                        "group flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3 text-xs transition-all hover:border-indigo-500/30 hover:bg-accent/40 shadow-sm relative overflow-hidden",
                                        isSub && "ml-4 border-l-2 border-l-indigo-400/40"
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded font-black",
                                        isSub 
                                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    )}>
                                        {isSub ? "H3" : "H2"}
                                    </span>
                                    <span className="flex-1 font-medium leading-relaxed text-foreground/90">{h}</span>
                                    <button
                                        onClick={() => copyToClipboard(h, i)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
                                        title="Copy heading text"
                                    >
                                        {copiedIndex === i ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* People Also Ask (Questions - redesigned) */}
                <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3.5"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                            <HelpCircle className="h-4 w-4 text-cyan-500" />
                            <span>People Also Ask</span>
                        </h3>
                        <span className="font-mono text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                            {brief.questions.length} queries
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                        {brief.questions.map((q, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-xs transition-all hover:border-cyan-500/30 hover:bg-accent/40 shadow-sm"
                            >
                                <span className="mt-0.5 shrink-0 font-mono text-[10px] font-black text-cyan-500/70">
                                    Q{i + 1}
                                </span>
                                <span className="flex-1 font-medium leading-relaxed text-foreground/80">{q}</span>
                                <button
                                    onClick={() => copyToClipboard(q, i + 100)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
                                    title="Copy question text"
                                >
                                    {copiedIndex === i + 100 ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Strategic SEO Insights (EEAT & Info Gain - redesigned) */}
            {(brief.eeatOpportunities?.length || brief.informationGain?.length) && (
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                    {/* EEAT Opportunities */}
                    {brief.eeatOpportunities && brief.eeatOpportunities.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="rounded-xl border-l-4 border-l-cyan-500 border border-border bg-card p-4 shadow-sm"
                        >
                            <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                <ShieldCheck className="h-4.5 w-4.5" />
                                <span>EEAT Strategy</span>
                            </h4>
                            <ul className="space-y-3">
                                {brief.eeatOpportunities.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed">
                                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/50" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Information Gain / Unique Angles */}
                    {brief.informationGain && brief.informationGain.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="rounded-xl border-l-4 border-l-indigo-500 border border-border bg-card p-4 shadow-sm"
                        >
                            <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                <Zap className="h-4.5 w-4.5" />
                                <span>Information Gain Angle</span>
                            </h4>
                            <ul className="space-y-3">
                                {brief.informationGain.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed">
                                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/50" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Entities (redesigned) */}
            {brief.entities?.length > 0 && (
                <div className="pt-2">
                    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        <span>LSI Keywords & Entities</span>
                        <div className="h-px flex-1 bg-border" />
                        <span className="font-mono text-[9px] bg-muted px-2 py-0.5 rounded-full">{brief.entities.length} items</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {brief.entities.map((e, i) => (
                            <motion.span 
                                key={i} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.01 * i }}
                                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border-hover transition-all cursor-default shadow-sm active:scale-95"
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
