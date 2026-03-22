"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Sparkles, Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  href: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  totalArticles: number;
  totalSites: number;
  hasWordPress: boolean;
}

export function OnboardingChecklist({ totalArticles, totalSites, hasWordPress }: OnboardingChecklistProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    // Check if user has dismissed onboarding
    const isDismissed = localStorage.getItem('onboarding-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Define onboarding steps
    const onboardingSteps: OnboardingStep[] = [
      {
        id: 'create-site',
        title: 'Create Your First Site',
        description: 'Set up your site profile with niche and brand voice',
        icon: Globe,
        action: 'Create Site',
        href: '/dashboard/sites/new',
        completed: totalSites > 0,
      },
      {
        id: 'generate-article',
        title: 'Generate Your First Article',
        description: 'Create SEO-optimized content with AI',
        icon: FileText,
        action: 'New Article',
        href: '/dashboard/articles/new',
        completed: totalArticles > 0,
      },
      {
        id: 'connect-wordpress',
        title: 'Connect WordPress (Optional)',
        description: 'Publish directly to your WordPress site',
        icon: Sparkles,
        action: 'Connect',
        href: '/dashboard/settings?tab=integrations',
        completed: hasWordPress,
      },
    ];

    setSteps(onboardingSteps);
  }, [totalArticles, totalSites, hasWordPress]);

  const completedCount = steps.filter(s => s.completed).length;
  const allCompleted = completedCount === steps.length;

  // Auto-dismiss when all steps completed
  useEffect(() => {
    if (allCompleted && !dismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || steps.length === 0) return null;

  return (
    <div className="card-premium rounded-xl lg:rounded-2xl border border-[#6366f1]/20 bg-[#6366f1]/5 p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 sm:h-32 sm:w-32 rounded-full blur-3xl bg-gold/10" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#818cf8]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-foreground truncate">
                {allCompleted ? '🎉 Setup Complete!' : 'Get Started'}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                {allCompleted 
                  ? 'You\'re all set!'
                  : `${completedCount}/${steps.length} completed`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
            aria-label="Dismiss onboarding"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-3 sm:mb-4 h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6366f1] to-[#22d3ee] transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2 sm:space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all gap-2",
                  step.completed
                    ? "bg-[#22d3ee]/5 border-[#22d3ee]/20"
                    : "bg-card border-border hover:border-[#6366f1]/30"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0",
                      step.completed
                        ? "bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee]"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs sm:text-sm font-medium truncate",
                      step.completed ? "text-[#22d3ee]" : "text-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                </div>
                {!step.completed && (
                  <button
                    onClick={() => router.push(step.href)}
                    className="px-2 py-1 text-[9px] font-semibold rounded-md border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#818cf8] hover:bg-[#6366f1]/20 transition-colors whitespace-nowrap shrink-0 tracking-wide uppercase"
                  >
                    {step.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
