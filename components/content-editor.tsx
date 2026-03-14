"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { calculateSEOScore, getScoreColor, getScoreBgColor, type SEOScore } from "@/lib/seo-scoring";
import { CheckCircle2, AlertCircle, TrendingUp, FileText, Eye, Edit3, Save, X, Sparkles, Loader2, Zap, Crown, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useUserPlan } from "@/lib/hooks/use-user-plan";
import { ImageSelector } from "@/components/image-selector";
import { SerpPreview } from "@/components/serp-preview-live";
import Link from "next/link";

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

interface ContentEditorProps {
  content: string;
  keyword: string;
  siteDomain?: string;
  onSave: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export function ContentEditor({ content, keyword, siteDomain, onSave, readOnly = false }: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const planData = useUserPlan();

  // Extract title and meta description from content
  const extractMetadata = (text: string) => {
    const lines = text.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '));
    const title = titleLine ? titleLine.replace('# ', '').trim() : keyword;
    
    // Get first paragraph as description
    const paragraphs = text.split('\n\n').filter(p => !p.startsWith('#') && p.trim().length > 0);
    const description = paragraphs[0]?.substring(0, 160) || `Learn everything about ${keyword}`;
    
    return { title, description };
  };

  const { title, description } = extractMetadata(editedContent);

  // Calculate SEO score on content change
  const calculateScore = useDebounce((text: string) => {
    const score = calculateSEOScore(text, keyword);
    setSeoScore(score);
  }, 500);

  useEffect(() => {
    calculateScore(editedContent);
  }, [editedContent, calculateScore]);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = async () => {
    if (editedContent === content) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(editedContent);
      toast.success("Content saved successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleAIOptimize = async () => {
    if (!seoScore || seoScore.suggestions.length === 0) {
      toast.info("Content is already well optimized!");
      return;
    }

    // Check optimization limits
    if (planData.optimizationsLimit !== 'unlimited' && 
        planData.optimizationsUsed >= planData.optimizationsLimit) {
      toast.error(`You've used all ${planData.optimizationsLimit} optimizations this month`);
      return;
    }

    try {
      setOptimizing(true);
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unable to get ID token");

      const res = await fetch("/api/articles/optimize-seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          content: editedContent,
          keyword,
          suggestions: seoScore.suggestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          toast.error(data.error, {
            action: {
              label: 'Upgrade',
              onClick: () => window.location.href = '/dashboard/settings'
            }
          });
          return;
        }
        throw new Error(data.error || "Optimization failed");
      }

      const { optimizedContent, optimizationsRemaining } = await res.json();
      setEditedContent(optimizedContent);
      
      const remainingText = optimizationsRemaining === 'unlimited' 
        ? 'Unlimited optimizations remaining' 
        : `${optimizationsRemaining} optimizations remaining this month`;
      
      toast.success(`Content optimized! ${remainingText}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to optimize");
    } finally {
      setOptimizing(false);
    }
  };

  const handleImageInsert = (markdown: string) => {
    // Insert image at cursor or end of content
    setEditedContent(prev => prev + '\n\n' + markdown + '\n\n');
    setShowImageSelector(false);
  };

  return (
    <div className="space-y-4">
      {/* Upgrade Banner for Free/Starter users with low scores */}
      {!planData.loading && seoScore && seoScore.overall < 80 && planData.planTier !== 'pro' && (
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/10 to-purple-600/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
              <Crown className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Unlock Higher SEO Scores
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {planData.planTier === 'free' 
                  ? 'Free plan limits scores to 70/100. Upgrade to Starter for 85/100 or Pro for 100/100.'
                  : 'Starter plan limits scores to 85/100. Upgrade to Pro for unlimited 100/100 scores.'}
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                <Zap className="h-3 w-3" />
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEO Score Panel */}
      {seoScore && (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">SEO Score</h3>
              {!planData.loading && (
                <span className="text-xs text-muted-foreground">
                  ({planData.planTier === 'free' ? 'Max 70' : planData.planTier === 'starter' ? 'Max 85' : 'Max 100'})
                </span>
              )}
            </div>
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1", getScoreBgColor(seoScore.overall))}>
              <span className={cn("text-2xl font-bold", getScoreColor(seoScore.overall))}>
                {seoScore.overall}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <ScoreCard
              label="Keyword"
              score={seoScore.keyword.score}
              details={`${seoScore.keyword.count}× used, ${seoScore.keyword.density.toFixed(1)}% density`}
            />
            <ScoreCard
              label="Readability"
              score={seoScore.readability.score}
              details={`${seoScore.readability.avgSentenceLength} words/sentence`}
            />
            <ScoreCard
              label="Structure"
              score={seoScore.structure.score}
              details={`${seoScore.structure.wordCount} words, ${seoScore.structure.headingCount} headings`}
            />
          </div>

          {/* Keyword Placement Indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
            <PlacementBadge
              label="In Title"
              active={seoScore.keyword.inTitle}
            />
            <PlacementBadge
              label="In First Paragraph"
              active={seoScore.keyword.inFirstParagraph}
            />
            <PlacementBadge
              label={`In ${seoScore.keyword.inHeadings} Heading${seoScore.keyword.inHeadings !== 1 ? 's' : ''}`}
              active={seoScore.keyword.inHeadings > 0}
            />
          </div>

          {/* Suggestions */}
          {seoScore.suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Suggestions to Improve
                  </p>
                  {!planData.loading && planData.optimizationsLimit !== 'unlimited' && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {planData.optimizationsUsed}/{planData.optimizationsLimit} optimizations used
                    </p>
                  )}
                </div>
                <button
                  onClick={handleAIOptimize}
                  disabled={optimizing || readOnly || (!planData.loading && planData.optimizationsLimit !== 'unlimited' && planData.optimizationsUsed >= planData.optimizationsLimit)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI Fix All
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-1.5">
                {seoScore.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-400" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Editor/Viewer */}
      <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-card/80">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {isEditing ? "Editing Content" : "Article Content"}
            </span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setShowImageSelector(!showImageSelector)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Add Image
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Content
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Image Selector */}
          {isEditing && showImageSelector && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Add Image from Unsplash</h4>
                <button
                  onClick={() => setShowImageSelector(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <ImageSelector keyword={keyword} onImageSelect={handleImageInsert} />
            </div>
          )}

          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[600px] font-mono text-sm resize-none border-0 focus-visible:ring-0 p-0"
              placeholder="Write your content here..."
            />
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* SERP Preview */}
      {siteDomain && (
        <SerpPreview
          title={title}
          description={description}
          domain={siteDomain}
          keyword={keyword}
        />
      )}
    </div>
  );
}

function ScoreCard({ label, score, details }: { label: string; score: number; details: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("text-lg font-bold", getScoreColor(score))}>{score}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/70">{details}</p>
    </div>
  );
}

function PlacementBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-border/60 bg-card/50 text-muted-foreground"
      )}
    >
      {active ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {label}
    </div>
  );
}
