/**
 * Onboarding Tour Component
 * Interactive tour with spotlight and tooltips
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@/lib/hooks/use-onboarding';

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  onNext: () => void;
  onPrevious: () => void;
  onDismiss: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
}

export function OnboardingTour({
  isActive,
  currentStep,
  steps,
  onNext,
  onPrevious,
  onDismiss,
  isFirstStep,
  isLastStep,
  progress,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Find and highlight target element
  useEffect(() => {
    if (!isActive || !step?.target) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    };

    // Wait for DOM to be ready
    setTimeout(findTarget, 100);

    // Update on resize
    window.addEventListener('resize', findTarget);
    return () => window.removeEventListener('resize', findTarget);
  }, [isActive, step, currentStep]);

  // Calculate tooltip position
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const position = step?.position || 'bottom';

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltip.height - padding;
        left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltip.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltip.height / 2;
        left = targetRect.left - tooltip.width - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltip.height / 2;
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip in viewport
    const maxLeft = window.innerWidth - tooltip.width - padding;
    const maxTop = window.innerHeight - tooltip.height - padding;
    
    left = Math.max(padding, Math.min(left, maxLeft));
    top = Math.max(padding, Math.min(top, maxTop));

    setTooltipPosition({ top, left });
  }, [targetRect, step?.position]);

  if (!isActive) return null;

  return (
    <>
      {/* Overlay with spotlight */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Spotlight cutout */}
        {targetRect && (
          <div
            className="absolute bg-transparent border-4 border-[var(--gold)] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] w-full max-w-[90vw] sm:max-w-md pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="bg-background border-2 border-[var(--gold)]/30 rounded-xl shadow-2xl p-4 sm:p-6 animate-slide-in-up">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)]">
                {step.title}
              </h3>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors touch-manipulation"
              aria-label="Close tour"
            >
              <X className="h-4 w-4 text-[var(--text-3)]" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[var(--text-2)] mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onPrevious}
              disabled={isFirstStep}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all touch-manipulation',
                isFirstStep
                  ? 'opacity-0 pointer-events-none'
                  : 'hover:bg-muted text-[var(--text-2)]'
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all',
                    index === currentStep
                      ? 'bg-[var(--gold)] w-4'
                      : index < currentStep
                      ? 'bg-[var(--gold)]/50'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white rounded-lg hover:scale-105 transition-transform touch-manipulation shadow-lg"
            >
              {isLastStep ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Finish</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Custom action */}
          {step.action && (
            <button
              onClick={step.action.onClick}
              className="w-full mt-3 px-4 py-2 text-xs sm:text-sm font-medium text-[var(--gold)] border border-[var(--gold)]/30 rounded-lg hover:bg-[var(--gold)]/10 transition-colors touch-manipulation"
            >
              {step.action.label}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
