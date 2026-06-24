"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, List, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { BriefPanel } from "@/components/article-editor/brief-panel";
import { OutlinePanel } from "@/components/article-editor/outline-panel";
import { DraftPanel } from "@/components/article-editor/draft-panel";
import { GenerationProgress } from "@/components/article-editor/generation-progress";
import type { BriefData, OutlineData, DraftData, OptimizationData } from "@/lib/types";

interface ContentCanvasProps {
  articleId: string;
  keyword: string;
  siteDomain?: string;
  zenMode: boolean;

  brief: BriefData | null;
  outline: OutlineData | null;
  draft: DraftData | null;
  optimization: OptimizationData | null;
  featuredImageUrl: string | null;
  targetWordCount: number;
  lsiKeywords?: string[];

  activeStep: number;
  autoPilotRunning: boolean;
  autoPilotPhase: "brief" | "outline" | "draft" | "seo" | null;
  outlineLoading: boolean;
  draftLoading: boolean;
  optLoading: boolean;
  thinkingText: string;
  phaseProgress: number;
  draftAccumulated: string;
  wordCount: number;

  stepRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;

  onGenerateOutline: () => void;
  onUpdateBrief: (brief: BriefData) => void;
  onGenerateDraft: (wc: number) => void;
  onOptimize: () => void;
  onPublish: () => void;
  onFeaturedImageChange: (img: any) => void;
  onContentDirty: () => void;
  onUpgradeRequired: (reason: string) => void;
}

const STEP_COLORS: Record<number, { label: string; accent: string; dot: string }> = {
  1: { label: "Step 1", accent: "border-l-cyan-500", dot: "bg-cyan-500" },
  2: { label: "Step 2", accent: "border-l-indigo-500", dot: "bg-indigo-500" },
  3: { label: "Step 3", accent: "border-l-violet-500", dot: "bg-violet-500" },
};

const STEP_META = [
  { id: 1, icon: FileText, label: "SEO Brief", desc: "Keyword research & content map" },
  { id: 2, icon: List, label: "Outline", desc: "Article structure & headings" },
  { id: 3, icon: PenLine, label: "Draft & Optimize", desc: "Write, score & publish" },
];

export function ContentCanvas({
  articleId,
  keyword,
  siteDomain,
  zenMode,
  brief,
  outline,
  draft,
  optimization,
  featuredImageUrl,
  targetWordCount,
  lsiKeywords,
  activeStep,
  autoPilotRunning,
  autoPilotPhase,
  outlineLoading,
  draftLoading,
  optLoading,
  thinkingText,
  phaseProgress,
  draftAccumulated,
  wordCount,
  stepRefs,
  onGenerateOutline,
  onUpdateBrief,
  onGenerateDraft,
  onOptimize,
  onPublish,
  onFeaturedImageChange,
  onContentDirty,
  onUpgradeRequired,
}: ContentCanvasProps) {
  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto transition-all duration-500",
        zenMode
          ? "pt-10 pb-40 px-4 sm:px-8 lg:px-16"
          : "pt-6 pb-32 px-4 sm:px-6 lg:px-8"
      )}
    >
      <div
        className={cn(
          "mx-auto space-y-0 transition-all duration-500",
          zenMode ? "max-w-3xl" : "max-w-[800px]"
        )}
      >
        {/* ── Step 1: SEO Brief ───────────────────────────────── */}
        <StepSection
          stepRef={(el) => { if (stepRefs.current) stepRefs.current[1] = el; }}
          stepId={1}
          isVisible={activeStep >= 1}
          isActive={activeStep === 1}
          isCompleted={activeStep > 1}
        >
          {brief ? (
            <BriefPanel
              brief={brief}
              keyword={keyword}
              onGenerate={onGenerateOutline}
              onUpdate={onUpdateBrief}
              onUpgradeRequired={onUpgradeRequired}
              loading={outlineLoading}
              done={!!outline}
            />
          ) : (
            <GenerationProgress
              phase="brief"
              thinkingText={thinkingText}
              progress={autoPilotPhase === "brief" ? 45 : 0}
            />
          )}
        </StepSection>

        {/* ── Step 2: Outline ─────────────────────────────────── */}
        {(outline || autoPilotPhase === "outline" || activeStep >= 2) && (
          <StepSection
            stepRef={(el) => { if (stepRefs.current) stepRefs.current[2] = el; }}
            stepId={2}
            isVisible={activeStep >= 2}
            isActive={activeStep === 2}
            isCompleted={activeStep > 2}
          >
            {outline ? (
              <OutlinePanel
                outline={outline}
                keyword={keyword}
                onGenerate={(wc: number) => onGenerateDraft(wc)}
                loading={draftLoading}
                done={!!draft}
                onUpgradeRequired={onUpgradeRequired}
              />
            ) : (
              <GenerationProgress
                phase="outline"
                thinkingText={thinkingText}
                progress={autoPilotPhase === "outline" ? 65 : 0}
              />
            )}
          </StepSection>
        )}

        {/* ── Step 3: Draft & Optimize ────────────────────────── */}
        {(draft || autoPilotPhase === "draft" || activeStep >= 3) && (
          <StepSection
            stepRef={(el) => { if (stepRefs.current) stepRefs.current[3] = el; }}
            stepId={3}
            isVisible={activeStep >= 3}
            isActive={activeStep === 3}
            isCompleted={!!optimization}
          >
            {draft ? (
              <DraftPanel
                draft={
                  draftLoading || autoPilotRunning
                    ? { ...draft, content: draftAccumulated }
                    : draft
                }
                keyword={keyword}
                articleId={articleId}
                siteDomain={siteDomain}
                featuredImageUrl={featuredImageUrl}
                onFeaturedImageChange={onFeaturedImageChange}
                onOptimize={onOptimize}
                onPublish={onPublish}
                loading={optLoading}
                done={!!optimization}
                hasSeoData={!!optimization}
                targetWordCount={targetWordCount}
                streaming={draftLoading || autoPilotRunning}
                onUpgradeRequired={onUpgradeRequired}
                brief={brief}
                onContentDirty={onContentDirty}
                lsiKeywords={lsiKeywords}
              />
            ) : (
              <GenerationProgress
                phase="draft"
                thinkingText={thinkingText}
                progress={autoPilotPhase === "draft" ? phaseProgress : 0}
              />
            )}
          </StepSection>
        )}
      </div>
    </main>
  );
}

// ── StepSection wrapper ─────────────────────────────────────────────
function StepSection({
  stepId,
  isVisible,
  isActive,
  isCompleted,
  stepRef,
  children,
}: {
  stepId: number;
  isVisible: boolean;
  isActive: boolean;
  isCompleted: boolean;
  stepRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  const colors = STEP_COLORS[stepId];
  const meta = STEP_META.find((m) => m.id === stepId)!;
  const Icon = meta.icon;

  return (
    <motion.div
      ref={stepRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 24 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative border-l-2 pl-6 pb-12 transition-all",
        isActive ? colors.accent : "border-l-border/40"
      )}
    >
      {/* Step dot */}
      <div
        className={cn(
          "absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center",
          isCompleted
            ? "bg-emerald-500"
            : isActive
            ? colors.dot
            : "bg-muted border-border"
        )}
      >
        {isCompleted && (
          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Step label */}
      <div className="mb-5 flex items-center gap-2">
        <span
          className={cn(
            "text-[9px] font-mono font-bold tracking-[0.18em] uppercase",
            isActive ? "text-muted-foreground" : "text-muted-foreground/50"
          )}
        >
          {colors.label}
        </span>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-0.5 border",
            isCompleted
              ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-400"
              : isActive
              ? "border-border bg-muted/30 text-foreground"
              : "border-transparent text-muted-foreground/40"
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="text-[11px] font-bold">{meta.label}</span>
        </div>
        {isCompleted && (
          <span className="text-[9px] font-semibold text-emerald-500/80 uppercase tracking-wider">
            Complete
          </span>
        )}
      </div>

      {/* Panel content */}
      {children}
    </motion.div>
  );
}
