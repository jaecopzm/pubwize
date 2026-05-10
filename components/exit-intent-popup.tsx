"use client";

import { useState, useEffect } from "react";
import { X, Zap, Crown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface ExitIntentPopupProps {
  planTier: string;
}

export function ExitIntentPopup({ planTier }: ExitIntentPopupProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (planTier !== 'free' || dismissed) return;

    const hasSeenOffer = localStorage.getItem('exit-offer-seen');
    if (hasSeenOffer) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !show) {
        setShow(true);
        localStorage.setItem('exit-offer-seen', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [planTier, dismissed, show]);

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Before you go</h2>
          <p className="text-sm text-muted-foreground">
            Upgrade when you're ready to unlock the full workflow
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Zap className="h-5 w-5 text-gold shrink-0" />
            <span className="text-sm">25 articles/month (vs 5 free)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <TrendingUp className="h-5 w-5 text-teal shrink-0" />
            <span className="text-sm">75 AI improvements (vs 10 free)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Crown className="h-5 w-5 text-lilac shrink-0" />
            <span className="text-sm">3 site connections (vs 1 free)</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-3xl font-bold mb-1">
            <span className="text-gold">$19</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Start with Starter and upgrade again as usage grows</p>
        </div>

        <button
          onClick={() => {
            handleClose();
            router.push('/dashboard/settings?tab=billing');
          }}
          className="w-full btn-gold py-3 text-base font-bold mb-3"
        >
          View Plans
        </button>

        <button
          onClick={handleClose}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          No thanks, I'll stay on free
        </button>
      </div>
    </div>
  );
}
