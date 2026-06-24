/**
 * Generation progress tracking and messaging
 */

export interface GenerationPhase {
  label: string;
  detail?: (keyword?: string) => string;
  durationMs: number; // approx time to spend on this phase
}

export interface GenerationStep {
  id: string;
  label: string;
  estimatedSeconds: number;
  phases: GenerationPhase[];
  tips: string[];
}

export const GENERATION_STEPS: Record<string, GenerationStep> = {
  brief: {
    id: 'brief',
    label: 'Generating SEO Brief',
    estimatedSeconds: 20,
    phases: [
      { label: 'Analyzing search intent', detail: (k) => `Understanding what users want when they search "${k}"`, durationMs: 3500 },
      { label: 'Researching topic cluster', detail: (k) => `Mapping related subtopics around "${k}"`, durationMs: 3500 },
      { label: 'Identifying content gaps', detail: () => 'Finding opportunities your competitors are missing', durationMs: 3500 },
      { label: 'Building keyword strategy', detail: (k) => `Selecting primary & LSI keywords for "${k}"`, durationMs: 4000 },
      { label: 'Finalizing your SEO brief', detail: () => 'Structuring content recommendations', durationMs: 3000 },
    ],
    tips: [
      'Articles with clear H2 headings rank 36% better',
      'Questions in titles get 14% more clicks',
      'Including "best" or "top" increases CTR by 21%',
    ],
  },
  outline: {
    id: 'outline',
    label: 'Creating Article Outline',
    estimatedSeconds: 15,
    phases: [
      { label: 'Structuring intro & hook', detail: () => 'Crafting an opening that keeps readers engaged', durationMs: 3000 },
      { label: 'Building section hierarchy', detail: (k) => `Organizing sections around "${k}"`, durationMs: 3000 },
      { label: 'Adding supporting points', detail: () => 'Filling each section with key talking points', durationMs: 3000 },
      { label: 'Optimizing for readability', detail: () => "Ensuring the structure flows naturally", durationMs: 3000 },
    ],
    tips: [
      '8+ sections make articles more scannable',
      'Listicles get 2x more shares than other formats',
      'A strong intro reduces bounce rate significantly',
    ],
  },
  draft: {
    id: 'draft',
    label: 'Writing Full Article',
    estimatedSeconds: 60,
    phases: [
      { label: 'Analyzing top‑ranking pages', detail: (k) => `Studying what makes top results for "${k}" great`, durationMs: 5000 },
      { label: 'Writing introduction', detail: () => 'Crafting a hook that captures attention immediately', durationMs: 7000 },
      { label: 'Expanding each section', detail: () => 'Writing detailed, value-packed paragraphs', durationMs: 10000 },
      { label: 'Weaving in keyword naturally', detail: (k) => `Adding "${k}" at the ideal density (1.5–2%)`, durationMs: 5000 },
      { label: 'Writing conclusion & CTA', detail: () => 'Closing with a compelling call to action', durationMs: 5000 },
      { label: 'Polishing for readability', detail: () => 'Shortening sentences, boosting clarity', durationMs: 5000 },
    ],
    tips: [
      'Articles with 8+ images rank 2x better',
      '1,500+ word articles rank higher on average',
      'Internal links can boost SEO by up to 40%',
      'Short intro paragraphs reduce bounce rate',
    ],
  },
  optimize: {
    id: 'optimize',
    label: 'Running SEO Analysis',
    estimatedSeconds: 12,
    phases: [
      { label: 'Scoring keyword density', detail: (k) => `Checking "${k}" usage across headings & body`, durationMs: 3000 },
      { label: 'Checking readability', detail: () => 'Measuring Flesch score and sentence complexity', durationMs: 3000 },
      { label: 'Auditing structure', detail: () => 'Verifying heading hierarchy and scan-ability', durationMs: 2500 },
      { label: 'Generating recommendations', detail: () => 'Preparing actionable SEO improvements', durationMs: 2500 },
    ],
    tips: [
      'Meta descriptions under 160 chars perform best',
      'Keywords in the first 100 words boost rankings',
      'Aim for 1–2% keyword density',
    ],
  },
};

export function getRandomTip(stepId: string): string {
  const step = GENERATION_STEPS[stepId];
  if (!step) return '';
  return step.tips[Math.floor(Math.random() * step.tips.length)];
}

export function getEstimatedTime(stepId: string): number {
  return GENERATION_STEPS[stepId]?.estimatedSeconds || 30;
}

export function getPhases(stepId: string): GenerationPhase[] {
  return GENERATION_STEPS[stepId]?.phases || [];
}
