/**
 * Welcome Modal Component
 * First-time user welcome experience
 */

'use client';

import { useState } from 'react';
import { X, Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  userName?: string;
}

export function WelcomeModal({
  isOpen,
  onClose,
  onStartTour,
  userName,
}: WelcomeModalProps) {
  const [step, setStep] = useState<'welcome' | 'features'>('welcome');

  if (!isOpen) return null;

  const features = [
    {
      icon: Sparkles,
      title: 'AI Article Generation',
      description: 'Create full-length, SEO-ready articles from a single keyword in under 2 minutes',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time SEO Scoring',
      description: 'Built-in content grader shows exactly which tweaks push you to page one',
    },
    {
      icon: Zap,
      title: 'WordPress Publishing',
      description: 'Push finished articles to any WordPress site with one click',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-background border-2 border-[var(--gold)]/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-bounce"
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'welcome' ? (
            // Welcome Step
            <div className="p-6 sm:p-8 md:p-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[var(--text-3)]" />
              </button>

              {/* Content */}
              <div className="text-center space-y-6">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[var(--gold)] to-[var(--teal)] rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-1)]">
                    Welcome to Pubwize{userName ? `, ${userName}` : ''}! 🎉
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-2)] max-w-lg mx-auto">
                    You're all set to create rank-ready articles in minutes. Let's show you around!
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-[var(--gold)]">2min</div>
                    <div className="text-[10px] sm:text-xs text-[var(--text-3)] mt-1">
                      Article Generation
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-[var(--teal)]">100%</div>
                    <div className="text-[10px] sm:text-xs text-[var(--text-3)] mt-1">
                      SEO Optimized
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-[var(--gold)]">1-Click</div>
                    <div className="text-[10px] sm:text-xs text-[var(--text-3)] mt-1">
                      Publishing
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setStep('features')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white rounded-xl hover:scale-105 transition-transform touch-manipulation shadow-lg"
                  >
                    <span>Show Me Around</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors touch-manipulation"
                  >
                    I'll Explore Myself
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Features Step
            <div className="p-6 sm:p-8 md:p-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[var(--text-3)]" />
              </button>

              {/* Content */}
              <div className="space-y-6">
                {/* Heading */}
                <div className="text-center space-y-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-1)]">
                    Here's What You Can Do
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-2)]">
                    Everything you need to create and publish SEO content
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--gold)] to-[var(--teal)] rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-[var(--text-1)] mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      onStartTour();
                      onClose();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white rounded-xl hover:scale-105 transition-transform touch-manipulation shadow-lg"
                  >
                    <span>Start Interactive Tour</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors touch-manipulation"
                  >
                    Skip Tour
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
