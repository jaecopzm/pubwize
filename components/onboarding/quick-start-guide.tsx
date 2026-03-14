/**
 * Quick Start Guide Component
 * Collapsible guide with step-by-step instructions
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Circle, Sparkles, FileText, Globe, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface QuickStartGuideProps {
  onStepComplete?: (stepId: string) => void;
}

export function QuickStartGuide({ onStepComplete }: QuickStartGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('pubwize_quickstart') || '[]'))
  );

  const steps: QuickStartStep[] = [
    {
      id: 'create-article',
      title: 'Create Your First Article',
      description: 'Generate an SEO-optimized article from a single keyword',
      icon: Sparkles,
      completed: completedSteps.has('create-article'),
      action: {
        label: 'Create Article',
        href: '/dashboard/articles/new',
      },
    },
    {
      id: 'review-content',
      title: 'Review & Optimize',
      description: 'Check SEO score and make improvements',
      icon: FileText,
      completed: completedSteps.has('review-content'),
    },
    {
      id: 'connect-wordpress',
      title: 'Connect WordPress',
      description: 'Link your WordPress site for one-click publishing',
      icon: Globe,
      completed: completedSteps.has('connect-wordpress'),
      action: {
        label: 'Connect Site',
        href: '/dashboard/sites/new',
      },
    },
    {
      id: 'schedule-content',
      title: 'Schedule Publishing',
      description: 'Plan your content calendar',
      icon: Calendar,
      completed: completedSteps.has('schedule-content'),
      action: {
        label: 'View Calendar',
        href: '/dashboard/calendar',
      },
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem('pubwize_quickstart', JSON.stringify([...newCompleted]));
    onStepComplete?.(stepId);
  };

  return (
    <div className="bg-gradient-to-br from-[var(--gold)]/5 to-[var(--teal)]/5 border border-[var(--gold)]/20 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--gold)] to-[var(--teal)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-1)]">
              Quick Start Guide
            </h3>
            <p className="text-[10px] sm:text-xs text-[var(--text-3)]">
              {completedCount} of {steps.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs font-medium text-[var(--gold)]">
            {Math.round(progress)}%
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-[var(--text-3)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--text-3)]" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-muted/50">
        <div
          className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all',
                step.completed
                  ? 'bg-[var(--gold)]/10 border border-[var(--gold)]/20'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              {/* Icon/Status */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <div className="w-8 h-8 bg-[var(--gold)] rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Circle className="h-4 w-4 text-[var(--text-3)]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text-1)]">
                    {step.title}
                  </h4>
                  <span className="text-[10px] text-[var(--text-3)] whitespace-nowrap">
                    Step {index + 1}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--text-2)] mb-2 leading-relaxed">
                  {step.description}
                </p>

                {/* Action */}
                {step.action && !step.completed && (
                  <a
                    href={step.action.href}
                    onClick={() => handleStepComplete(step.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-medium text-[var(--gold)] border border-[var(--gold)]/30 rounded-lg hover:bg-[var(--gold)]/10 transition-colors touch-manipulation"
                  >
                    {step.action.label}
                  </a>
                )}

                {step.completed && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[var(--gold)]">
                    <Check className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Completion message */}
          {completedCount === steps.length && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[var(--gold)]/20 to-[var(--teal)]/20 rounded-lg text-center">
              <p className="text-sm font-bold text-[var(--text-1)] mb-1">
                🎉 You're all set!
              </p>
              <p className="text-xs text-[var(--text-2)]">
                You've completed the quick start guide. Happy writing!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
