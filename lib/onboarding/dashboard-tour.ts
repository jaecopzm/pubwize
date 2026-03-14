/**
 * Dashboard Onboarding Tour Configuration
 * Defines the steps for the dashboard tour
 */

import { OnboardingStep } from '@/lib/hooks/use-onboarding';

export const dashboardTourSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard',
    description: 'This is your command center for creating and managing SEO content. Let\'s take a quick tour!',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'create-article',
    title: 'Create Your First Article',
    description: 'Click here to generate an SEO-optimized article from a single keyword. It takes less than 2 minutes!',
    target: '[data-tour="create-article"]',
    position: 'bottom',
    action: {
      label: 'Create Article Now',
      onClick: () => {
        window.location.href = '/dashboard/articles/new';
      },
    },
  },
  {
    id: 'articles-list',
    title: 'Your Articles',
    description: 'All your articles are listed here. You can edit, optimize, and publish them to WordPress.',
    target: '[data-tour="articles-list"]',
    position: 'right',
  },
  {
    id: 'research',
    title: 'Keyword Research',
    description: 'Find low-competition keywords with live search data. Perfect for planning your content strategy.',
    target: '[data-tour="research"]',
    position: 'right',
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: 'Schedule and plan your content publishing. Drag and drop articles to schedule them.',
    target: '[data-tour="calendar"]',
    position: 'right',
  },
  {
    id: 'sites',
    title: 'WordPress Sites',
    description: 'Connect your WordPress sites here for one-click publishing. No more copy-pasting!',
    target: '[data-tour="sites"]',
    position: 'right',
  },
  {
    id: 'settings',
    title: 'Settings & Usage',
    description: 'Check your usage, upgrade your plan, and manage your account settings.',
    target: '[data-tour="settings"]',
    position: 'right',
  },
];

export const articleEditorTourSteps: OnboardingStep[] = [
  {
    id: 'editor-welcome',
    title: 'Article Editor',
    description: 'This is where you can review and refine your AI-generated article.',
    target: '[data-tour="editor"]',
    position: 'bottom',
  },
  {
    id: 'seo-score',
    title: 'SEO Score',
    description: 'Your article\'s SEO score is calculated in real-time. Aim for 80+ for best results!',
    target: '[data-tour="seo-score"]',
    position: 'left',
  },
  {
    id: 'content-editor',
    title: 'Edit Content',
    description: 'Click any section to edit it. The AI can also help you improve specific sections.',
    target: '[data-tour="content"]',
    position: 'top',
  },
  {
    id: 'ai-improve',
    title: 'AI Improvements',
    description: 'Use AI to fix grammar, improve readability, or regenerate sections that need work.',
    target: '[data-tour="ai-improve"]',
    position: 'left',
  },
  {
    id: 'publish',
    title: 'Publish to WordPress',
    description: 'When you\'re happy with your article, publish it directly to your WordPress site!',
    target: '[data-tour="publish"]',
    position: 'left',
  },
];

export const researchTourSteps: OnboardingStep[] = [
  {
    id: 'research-welcome',
    title: 'Keyword Research',
    description: 'Find the perfect keywords for your content strategy.',
    target: '[data-tour="research"]',
    position: 'bottom',
  },
  {
    id: 'search-input',
    title: 'Enter Your Seed Keyword',
    description: 'Start with a broad topic or keyword. We\'ll find related keywords with search data.',
    target: '[data-tour="search-input"]',
    position: 'bottom',
  },
  {
    id: 'results',
    title: 'Keyword Suggestions',
    description: 'Browse suggestions, questions, and related searches. Select up to 5 to generate articles.',
    target: '[data-tour="results"]',
    position: 'top',
  },
  {
    id: 'filters',
    title: 'Filter Results',
    description: 'Filter by type (suggestions, questions, related) to find the best keywords.',
    target: '[data-tour="filters"]',
    position: 'bottom',
  },
  {
    id: 'generate',
    title: 'Generate Articles',
    description: 'Select keywords and click here to generate multiple articles at once!',
    target: '[data-tour="generate"]',
    position: 'top',
  },
];
