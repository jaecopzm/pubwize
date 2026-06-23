"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Download, Trash2, PenLine, Zap, MessageSquare, GripVertical, Check } from "lucide-react";
import { toast } from "sonner";
import { GenerateCTA } from "./generate-cta";
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

    // Word Count Categories based on length
    const getLengthCategory = (words: number) => {
        if (words < 1000) return { label: "Short Form", desc: "Best for quick news or updates" };
        if (words <= 1800) return { label: "Standard Guide", desc: "Best for blogs and in-depth articles" };
        return { label: "Authority Pillar", desc: "Best for comprehensive organic search rankings" };
    };

    const lengthInfo = getLengthCategory(targetWordCount);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* Quality Suggestions */}
            <WorkflowSuggestions step="outline" data={{ sections }} />

            {/* Word count slider (Redesigned) */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Target Content Length</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{lengthInfo.desc}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-lg">
                        <span className="text-xs font-bold text-foreground tabular-nums">{targetWordCount.toLocaleString()}</span>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">words</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="relative group h-2">
                        <div className="absolute inset-0 h-2 rounded-full bg-muted overflow-hidden pointer-events-none">
                            <div 
                                className="h-full bg-primary transition-all duration-150"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <input
                            type="range" min="500" max="2500" step="100"
                            value={targetWordCount}
                            onChange={(e) => setTargetWordCount(Number(e.target.value))}
                            className="absolute inset-0 w-full h-2 appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow"
                        />
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground px-1">
                        <span>500 words</span>
                        <span className="text-primary font-semibold">{lengthInfo.label}</span>
                        <span>2,500 words</span>
                    </div>
                </div>

                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Average length per section:</span>
                    <span className="text-foreground font-bold">~{Math.floor(targetWordCount / sections.length)} words</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold">
                        {sections.length}
                    </span>
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Outline Sections
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={addSection}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Section
                    </button>
                    <button
                        onClick={exportOutline}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 shadow-sm"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export Outline
                    </button>
                </div>
            </div>

            {/* Sections list (Redesigned) */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {sections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.03 }}
                            className="group relative rounded-xl border border-border bg-card hover:bg-accent/30 hover:border-border-hover transition-all overflow-hidden shadow-sm p-3 flex items-center gap-3"
                        >
                            {/* Drag handle decoration */}
                            <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 cursor-grab group-hover:text-muted-foreground/60 transition-colors" />

                            {/* Level badge */}
                            <div className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-black leading-none",
                                section.level === 3 
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            )}>
                                {section.level === 3 ? "H3" : "H2"}
                            </div>

                            {/* Content & Inline Edit State */}
                            <div className="min-w-0 flex-1">
                                {editingIndex === i ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={editedHeading}
                                            onChange={(e) => setEditedHeading(e.target.value)}
                                            onBlur={() => {
                                                if (editedHeading.trim()) {
                                                    sections[i].heading = editedHeading;
                                                    setSections([...sections]);
                                                }
                                                setEditingIndex(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    if (editedHeading.trim()) {
                                                        sections[i].heading = editedHeading;
                                                        setSections([...sections]);
                                                    }
                                                    setEditingIndex(null);
                                                    toast.success("Heading updated");
                                                }
                                            }}
                                            autoFocus
                                            className="w-full bg-background border border-primary/50 px-2 py-1 rounded text-xs font-semibold text-foreground outline-none shadow-inner"
                                        />
                                        <button 
                                            onClick={() => {
                                                if (editedHeading.trim()) {
                                                    sections[i].heading = editedHeading;
                                                    setSections([...sections]);
                                                }
                                                setEditingIndex(null);
                                            }}
                                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <h4 className="text-xs font-semibold text-foreground leading-tight truncate">{section.heading}</h4>
                                        
                                        <div className="flex items-center gap-1 shrink-0">
                                            {section.answerTarget && (
                                                <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                                                    <Zap className="h-2 w-2" />Ans
                                                </span>
                                            )}
                                            {section.isFaq && (
                                                <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                                                    <MessageSquare className="h-2 w-2" />FAQ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {section.notes && !editingIndex && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-normal italic">
                                        {section.notes}
                                    </p>
                                )}
                            </div>

                            {/* Actions on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto pl-2">
                                <button
                                    onClick={() => { setEditingIndex(i); setEditedHeading(section.heading); }}
                                    className="p-1.5 rounded-lg bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-90"
                                    title="Edit Section"
                                >
                                    <PenLine className="h-3.5 w-3.5" />
                                </button>
                                {sections.length > 1 && (
                                    <button
                                        onClick={() => removeSection(i)}
                                        className="p-1.5 rounded-lg bg-muted/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-90"
                                        title="Remove Section"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Generate CTA */}
            {loading ? (
                <div className="py-4">
                    <GenerateCTA onClick={() => {}} loading={true} done={false} label="" doneLabel="" />
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
