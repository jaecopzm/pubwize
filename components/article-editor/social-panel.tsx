"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Copy, Check, Loader2, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GenerateCTA } from "./generate-cta";
import type { SocialMediaData } from "@/lib/types";

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const PLATFORMS = [
  { key: "twitter" as const,   label: "X / Twitter", Icon: TwitterIcon,   color: "text-foreground",   accent: "rgba(0,0,0,0.06)" },
  { key: "linkedin" as const,  label: "LinkedIn",     Icon: LinkedInIcon,  color: "text-[#0A66C2]",   accent: "rgba(10,102,194,0.08)" },
  { key: "instagram" as const, label: "Instagram",    Icon: InstagramIcon, color: "text-[#E4405F]",   accent: "rgba(228,64,95,0.08)" },
  { key: "facebook" as const,  label: "Facebook",     Icon: FacebookIcon,  color: "text-[#1877F2]",   accent: "rgba(24,119,242,0.08)" },
];

interface SocialPanelProps {
  socialMedia: SocialMediaData | null;
  articleId: string;
  keyword: string;
  content: string;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SocialPanel({ socialMedia, articleId, keyword, content, onGenerate, isGenerating }: SocialPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("twitter");

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Empty state ────────────────────────────────────────────────
  if (!socialMedia) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-lg border border-border bg-muted/20">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Share2 className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No social posts yet</p>
        <p className="text-xs text-muted-foreground mb-3">Generate platform-optimized posts from your article.</p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isGenerating ? "Generating..." : "Generate Posts"}
        </button>
      </div>
    );
  }

  const activePlatform = PLATFORMS.find(p => p.key === activeTab)!;
  const activePosts: string[] = (socialMedia as any)[activeTab] ?? [];

  // ── Filled state ───────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-16 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-muted-foreground/50">Social Content</p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 disabled:opacity-50 transition-all active:scale-95"
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Regenerate
        </button>
      </div>

      {/* Platform tab strip */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-muted/30">
        {PLATFORMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all",
              activeTab === key
                ? "bg-card border border-border shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("h-3 w-3 shrink-0", activeTab === key ? activePlatform.color : "")}>
              <Icon />
            </span>
            <span className="hidden sm:inline truncate">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Posts */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-2"
        >
          {activePosts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No posts for this platform.</p>
          ) : (
            activePosts.map((post, idx) => {
              const postId = `${activeTab}-${idx}`;
              const isTwitter = activeTab === "twitter";
              const overLimit = isTwitter && post.length > 280;
              return (
                <div
                  key={idx}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Post body */}
                  <textarea
                    value={post}
                    readOnly
                    rows={4}
                    className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-xs text-foreground/80 leading-relaxed outline-none"
                  />
                  {/* Footer */}
                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                    <span className={cn(
                      "text-[9px] font-mono tabular-nums",
                      overLimit ? "text-destructive" : "text-muted-foreground/50"
                    )}>
                      {post.length}{isTwitter && ` / 280`}
                    </span>
                    <button
                      onClick={() => copy(post, postId)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-[9px] font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                      {copiedId === postId ? <Check className="h-2.5 w-2.5 text-[#22d3ee]" /> : <Copy className="h-2.5 w-2.5" />}
                      {copiedId === postId ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hashtags */}
      {socialMedia.hashtags?.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hashtags</p>
          <div className="flex flex-wrap gap-1.5">
            {socialMedia.hashtags.map((tag, i) => {
              const tagId = `hashtag-${i}`;
              return (
                <button
                  key={i}
                  onClick={() => copy(tag, tagId)}
                  className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95"
                >
                  {tag}
                  {copiedId === tagId && <Check className="h-2.5 w-2.5 text-emerald-500 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
