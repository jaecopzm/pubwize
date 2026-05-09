"use client";

import { useState } from "react";
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
        const markdown = `# Article Outline\n\n${sections.map((s, i) => `## ${i + 1}. ${s.heading}\n${s.notes ? `*${s.notes}*\n` : ''}`).join('\n')}`;
        navigator.clipboard.writeText(markdown);
        toast.success("Outline copied to clipboard!");
    };

    const addSection = () => {
        setSections([...sections, { heading: "New Section", notes: "" }]);
        toast.success("Section added");
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
        toast.success("Section removed");
    };

    const estimatedWords = sections.length * Math.floor(targetWordCount / sections.length);

    return (
        <div className="space-y-4">
            {/* Quality Suggestions */}
            <WorkflowSuggestions step="outline" data={{ sections }} />
            
            {/* Word Count Control */}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-semibold text-text-1">
                        Target Word Count
                    </label>
                    <span className="text-sm font-bold text-gold">
                        {targetWordCount.toLocaleString()}
                    </span>
                </div>
                <input
                    type="range"
                    min="500"
                    max="2500"
                    step="50"
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, var(--gold) 0%, var(--gold) ${((targetWordCount - 500) / 2000) * 100}%, rgba(255,255,255,0.1) ${((targetWordCount - 500) / 2000) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                />
                <div className="flex justify-between mt-1 text-[10px] text-text-3">
                    <span>500</span>
                    <span>~{Math.floor(targetWordCount / sections.length)}/section</span>
                    <span>2,500</span>
                </div>
            </div>



            {/* Stats and Actions */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-text-3">
                    <span>{sections.length} sections</span>
                    <span>•</span>
                    <span>~{estimatedWords.toLocaleString()} words</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={addSection}
                        className="group relative flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-2 sm:px-2.5 py-1.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-teal transition-all hover:bg-teal/10 hover:border-teal/50 hover:shadow-lg hover:shadow-teal/10 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/10 to-teal/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Plus className="h-3 w-3 sm:h-3 sm:w-3 relative z-10 group-hover:rotate-90 transition-transform" />
                        <span className="sm:hidden relative z-10">Add Section</span>
                        <span className="hidden sm:inline relative z-10">Add</span>
                    </button>
                    <button
                        onClick={exportOutline}
                        className="group relative flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2 sm:px-2.5 py-1.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Download className="h-3 w-3 sm:h-3 sm:w-3 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="sm:hidden relative z-10">Export Outline</span>
                        <span className="hidden sm:inline relative z-10">Export</span>
                    </button>
                </div>
            </div>

            {/* Sections List */}
            <div className="space-y-2">
                {sections.map((section, i) => (
                    <div key={i} className="group rounded-lg border px-2.5 py-2 transition-all card-premium">
                        <div className="flex gap-2">
                            <div className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold",
                                section.level === 3 ? "bg-lilac/15 text-lilac" : "bg-gold/15 text-gold"
                            )}>
                                {i + 1}
                            </div>
                            <div className={cn(
                                "min-w-0 flex-1",
                                section.level === 3 && "pl-2 border-l border-white/5"
                            )}>
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
                                            if (e.key === 'Enter') {
                                                sections[i].heading = editedHeading;
                                                setSections([...sections]);
                                                setEditingIndex(null);
                                                toast.success("Heading updated");
                                            }
                                        }}
                                        autoFocus
                                        className="w-full bg-transparent border-b border-gold text-xs sm:text-sm font-semibold outline-none text-text-1"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-text-1 break-words leading-snug">{section.heading}</p>
                                )}
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {section.level && (
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase px-1 py-0.5 rounded border",
                                            section.level === 3 ? "bg-lilac/10 border-lilac/20 text-lilac" : "bg-gold/10 border-gold/20 text-gold"
                                        )}>
                                            H{section.level}
                                        </span>
                                    )}
                                    {section.answerTarget && (
                                        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase px-1 py-0.5 rounded border bg-teal/10 border-teal/20 text-teal">
                                            <Zap className="h-2 w-2" />
                                            Snippet
                                        </span>
                                    )}
                                    {section.isFaq && (
                                        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase px-1 py-0.5 rounded border bg-blue-400/10 border-blue-400/20 text-blue-400">
                                            <MessageSquare className="h-2 w-2" />
                                            FAQ
                                        </span>
                                    )}
                                </div>
                                {section.notes && (
                                    <p className="mt-1.5 text-xs leading-snug text-text-3 break-words line-clamp-2">{section.notes}</p>
                                )}
                                {section.answerTarget && (
                                    <div className="mt-1.5 p-1.5 rounded bg-surface-2/50 border border-white/5 flex items-start gap-1.5">
                                        <Quote className="h-2.5 w-2.5 text-teal shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-text-3 leading-snug line-clamp-2">
                                            <span className="text-text-2 font-medium">Target:</span> {section.answerTarget}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-start gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingIndex(i);
                                        setEditedHeading(section.heading);
                                    }}
                                    className="p-1 rounded hover:bg-white/5 active:scale-95 touch-manipulation"
                                    title="Edit"
                                >
                                    <PenLine className="h-3.5 w-3.5 text-text-3" />
                                </button>
                                {sections.length > 1 && (
                                    <button
                                        onClick={() => removeSection(i)}
                                        className="p-1 rounded hover:bg-white/5 active:scale-95 touch-manipulation"
                                        title="Remove"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {done && (
                            <div className="mt-2 flex justify-end">
                                <SectionRegenerate
                                    sectionHeading={section.heading}
                                    sectionContent={section.notes || ''}
                                    keyword={keyword}
                                    onRegenerate={(newContent) => {
                                        sections[i].notes = newContent;
                                        setSections([...sections]);
                                    }}
                                    onUpgradeRequired={onUpgradeRequired}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {loading ? (
                <GenerationLoader step="draft" message="Drafting your article..." />
            ) : (
                <div className="pt-2 w-full">
                    <GenerateCTA
                        onClick={() => onGenerate(targetWordCount)}
                        loading={loading}
                        done={done}
                        label="Generate Full Draft →"
                        doneLabel="Draft Generated"
                        onRegenerate={done ? () => onGenerate(targetWordCount) : undefined}
                    />
                </div>
            )}
        </div>
    );
}
