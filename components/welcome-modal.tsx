"use client";

import { X, Sparkles, FileText, Zap, Globe, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-xl sm:rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-gold" />
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Welcome to <span className="gradient-gold-teal">PubWize</span>!
              </h2>
            </div>
            <p className="text-sm text-text-3">
              You're on the Free plan. Here's what you can do:
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-1 p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Tier Features */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-teal/5 border border-teal/20">
            <div className="h-10 w-10 rounded-lg bg-teal/20 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">5 Articles per Month</h3>
              <p className="text-xs text-text-3">Full AI workflow: Brief → Outline → Draft → SEO → Social</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-lilac/5 border border-lilac/20">
            <div className="h-10 w-10 rounded-lg bg-lilac/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-lilac" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">10 AI Improvements</h3>
              <p className="text-xs text-text-3">Polish your content with AI suggestions</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
            <div className="h-10 w-10 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">1 Site Connection</h3>
              <p className="text-xs text-text-3">Set up your brand voice and publish to WordPress</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-teal" />
            Quick Start Guide
          </h3>
          <ol className="space-y-2 text-xs text-text-3">
            <li className="flex items-start gap-2">
              <span className="font-bold text-gold shrink-0">1.</span>
              <span>Create your first site with brand voice</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-gold shrink-0">2.</span>
              <span>Generate an SEO brief for your target keyword</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-gold shrink-0">3.</span>
              <span>Let AI create outline and draft</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-gold shrink-0">4.</span>
              <span>Optimize for SEO and publish!</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-card hover:bg-card/80 font-semibold text-sm transition-all"
          >
            I'll Explore
          </button>
          <button
            onClick={() => {
              onClose();
              router.push('/dashboard/sites/new');
            }}
            className="flex-1 px-4 py-3 rounded-lg bg-gold text-obsidian hover:bg-gold/90 font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Create First Site
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-3">
            Need more? <button onClick={() => router.push('/dashboard/settings?tab=billing')} className="text-gold hover:underline">Upgrade to Starter</button> for 25 articles/month
          </p>
        </div>
      </div>
    </div>
  );
}
