"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Download, Trash2, PenLine, Zap, MessageSquare, Quote } from "lucide-react";
import { toast } from "sonner";
import { SectionRegenerate } from "./section-regenerate";
import { GenerateCTA } from "./shared-ui";
import { GenerationLoader } from "@/components/generation-loader";
import { cn } from "@/lib/utils";
import type { OutlineData } from "@/lib/types";
import { WorkflowSuggestions } from "./workflow-suggestions";

export function OutlinePanel({
    outline,
    onGenerate,
    loading,
    done,
    keyword,
    onUpgradeRequired,
}: {
    outline: OutlineData;
    onGenerate: (targetWordCount: number) => void;
    loading: boolean;
    done: boolean;
    keyword: string;
    onUpgradeRequired?: (reason: string) => void;
}) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedHeading, setEditedHeading] = useState("");
    const [sections, setSections] = useState(outline.sections);
    const [targetWordCount, setTargetWordCount] = useState<number>(2000);

    const exportOutline = () => {
        const markdown = `# Article Outline\n\n${sections.map((s, i) => `## ${i + 1}. ${s.heading}${s.notes ? `\n*${s.notes}*` : ''}`).join('\n\n')}`;
        navigator.clipboard.writeText(markdown);
        toast.success("Outline copied!");
    };

    const addSection = () => {
        setSections([...sections, { heading: "New Section", notes: "" }]);
        toast.success("Section added");
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const pct = ((targetWordCount - 500) / 2000) * 100;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Quality Suggestions */}
            <WorkflowSuggestions step="outline" data={{ sections }} />

            {/* Word count slider */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Length</h3>
                    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-0.5">
                        <span className="text-xs font-bold text-foreground tabular-nums">{targetWordCount.toLocaleString()}</span>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">words</span>
                    </div>
                </div>
                <div className="relative group h-1.5">
                    <div className="absolute inset-0 h-1.5 rounded-full bg-muted overflow-hidden pointer-events-none">
                        <div 
                            className="h-full bg-primary transition-all duration-150"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <input
                        type="range" min="500" max="2500" step="100"
                        value={targetWordCount}
                        onChange={(e) => setTargetWordCount(Number(e.target.value))}
                        className="absolute inset-0 w-full appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:-mt-[3px] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                    />
                </div>
                <div className="flex justify-between mt-2.5">
                    <span className="text-[9px] font-semibold text-muted-foreground">500</span>
                    <div className="flex items-center gap-1 rounded-md bg-cyan-500/10 dark:bg-cyan-400/10 px-2 py-0.5 border border-cyan-500/20 dark:border-cyan-400/20">
                        <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">~{Math.floor(targetWordCount / sections.length)} / section</span>
                    </div>
                    <span className="text-[9px] font-semibold text-muted-foreground">2,500</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
                        {sections.length} Sections
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={addSection}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 sm:py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
                    >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">Add</span>
                    </button>
                    <button
                        onClick={exportOutline}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 sm:py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
                    >
                        <Download className="h-3 w-3" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Sections list */}
            <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                    {sections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/20 transition-all overflow-hidden shadow-sm"
                        >
                            <div className="flex items-center gap-2 px-2.5 py-2">
                                {/* Index badge */}
                                <div className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-bold",
                                    section.level === 3 
                                        ? "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400" 
                                        : "bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400"
                                )}>
                                    {i + 1}
                                </div>

                                {/* Content */}
                                <div className={cn("min-w-0 flex-1", section.level === 3 && "pl-2 border-l border-border")}>
                                    {editingIndex === i ? (
                                        <input
                                            type="text"
                                            value={editedHeading}
                                            onChange={(e) => setEditedHeading(e.target.value)}
                                            onBlur={() => {
                                                sections[i].heading = editedHeading;
                                                setSections([...sections]);
                                                setEditingIndex(null);
                                                toast.success("Heading updated");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    sections[i].heading = editedHeading;
                                                    setSections([...sections]);
                                                    setEditingIndex(null);
                                                    toast.success("Heading updated");
                                                }
                                            }}
                                            autoFocus
                                            className="w-full bg-transparent border-b border-primary text-xs font-semibold text-foreground outline-none pb-0.5"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="text-xs font-semibold text-foreground leading-tight">{section.heading}</h4>
                                            {/* Tags inline with heading */}
                                            {section.level && (
                                                <span className={cn(
                                                    "text-[8px] font-bold uppercase px-1 py-0.5 rounded border shrink-0",
                                                    section.level === 3
                                                        ? "bg-purple-500/10 dark:bg-purple-400/10 border-purple-500/20 dark:border-purple-400/20 text-purple-600 dark:text-purple-400"
                                                        : "bg-indigo-500/10 dark:bg-indigo-400/10 border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400"
                                                )}>
                                                    H{section.level}
                                                </span>
                                            )}
                                            {section.answerTarget && (
                                                <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase px-1 py-0.5 rounded border bg-cyan-500/10 dark:bg-cyan-400/10 border-cyan-500/20 dark:border-cyan-400/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                                                    <Zap className="h-2 w-2" />Ans
                                                </span>
                                            )}
                                            {section.isFaq && (
                                                <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase px-1 py-0.5 rounded border bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 shrink-0">
                                                    <MessageSquare className="h-2 w-2" />FAQ
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions — visible on hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <button
                                        onClick={() => { setEditingIndex(i); setEditedHeading(section.heading); }}
                                        className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-90"
                                        title="Edit"
                                    >
                                        <PenLine className="h-3 w-3" />
                                    </button>
                                    {sections.length > 1 && (
                                        <button
                                            onClick={() => removeSection(i)}
                                            className="p-1 rounded bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all active:scale-90"
                                            title="Remove"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Generate CTA */}
            {loading ? (
                <div className="py-4">
                    <GenerationLoader step="draft" message="Synthesizing detailed content blocks..." />
                </div>
            ) : (
                <div className="pt-4">
                    <GenerateCTA
                        onClick={() => onGenerate(targetWordCount)}
                        loading={loading}
                        done={done}
                        label="Draft Full Article"
                        doneLabel="Structure Approved"
                        onRegenerate={done ? () => onGenerate(targetWordCount) : undefined}
                    />
                </div>
            )}
        </motion.div>
    );
}
