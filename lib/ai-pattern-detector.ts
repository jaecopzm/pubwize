/**
 * Client-side heuristic AI pattern detector.
 * Flags common AI-writing tells using statistical analysis.
 * No API calls, no cost.
 */

const AI_CLICHES = [
  "in today's digital", "in today's fast-paced", "in this digital age",
  "in the ever-evolving", "it is crucial to", "it is important to",
  "it is essential to", "it is worth noting", "it goes without saying",
  "when it comes to", "a wide range of", "a plethora of",
  "in a nutshell", "the bottom line", "at the end of the day",
  "delve into", "navigate the", "landscape of",
  "let's dive", "let me walk you through", "let's explore",
  "harness the power", "unlock the potential", "drive results",
  "cutting-edge", "game-changer", "thought-provoking",
  "in conclusion", "in summary", "to sum up",
  "first and foremost", "last but not least",
  "the fact of the matter", "the truth is",
  "to put it simply", "in other words",
  "needless to say", "it should be noted",
  "as previously mentioned", "as discussed earlier",
  "the aforementioned", "the following",
  "in terms of", "with regard to", "with respect to",
  "there are several", "there are many", "there are various",
  "one of the most", "some of the", "a number of",
  "ultimately", "essentially", "basically",
  "arguably", "undeniably", "undoubtedly",
  "importantly", "notably", "significantly",
  "moreover", "furthermore", "nevertheless",
  "consequently", "accordingly", "subsequently",
  "effectively", "efficiently", "strategically",
  "seamlessly", "effortlessly", "perfectly",
];

const TRANSITION_WORDS = [
  "however", "therefore", "moreover", "furthermore", "nevertheless",
  "consequently", "additionally", "meanwhile", "otherwise", "nonetheless",
  "thus", "hence", "thereafter", "accordingly",
];

export interface PatternResult {
  overallScore: number;
  sections: PatternSections;
  flags: string[];
}

export interface PatternSections {
  clicheDensity: number;
  burstiness: number;
  transitionVariety: number;
  sentenceLengthEvenness: number;
}

/**
 * Split text into sentences, handling common abbreviations.
 */
function splitSentences(text: string): string[] {
  const cleaned = text
    .replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|dept|est|approx)\./gi, "$1<PERIOD>")
    .replace(/(\d+)\.(\d+)/g, "$1<DOT>$2");
  const raw = cleaned.split(/[.!?]+/);
  return raw
    .map(s => s.replace(/<PERIOD>/g, ".").replace(/<DOT>/g, ".").trim())
    .filter(s => s.split(/\s+/).filter(Boolean).length >= 3);
}

/**
 * Calculate burstiness — variance in sentence length.
 * Human writing has high variance; AI is uniform.
 */
function calcBurstiness(sentences: string[]): number {
  if (sentences.length < 3) return 50;
  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 50;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.min(100, Math.round(cv * 100));
}

/**
 * Calculate cliche density — percentage of sentences containing AI cliches.
 */
function calcClicheDensity(text: string, sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const lower = text.toLowerCase();
  const clicheHits = AI_CLICHES.filter(c => lower.includes(c)).length;
  const ratio = clicheHits / sentences.length;
  return Math.min(100, Math.round(ratio * 500));
}

/**
 * Calculate transition word variety — how many unique transition words per sentence.
 */
function calcTransitionVariety(text: string, sentences: number): number {
  if (sentences === 0) return 50;
  const lower = text.toLowerCase();
  const hits = TRANSITION_WORDS.filter(w => lower.includes(w)).length;
  const ratio = hits / sentences;
  if (ratio < 0.05) return 95;
  if (ratio < 0.15) return 80;
  if (ratio < 0.3) return 50;
  if (ratio < 0.5) return 20;
  return 0;
}

/**
 * Check if sentence lengths are too even (hallmark of AI).
 */
function calcEvenness(sentences: string[]): number {
  if (sentences.length < 5) return 50;
  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const sorted = [...lengths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  const deviations = lengths.map(l => Math.abs(l - median));
  const avgDev = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const cv = median > 0 ? avgDev / median : 0;
  return Math.min(100, Math.round(cv * 200));
}

/**
 * Main analysis function. Returns scores where higher = more human-like.
 */
export function analyzePatterns(content: string): PatternResult {
  const text = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>|]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const sentences = splitSentences(text);
  if (sentences.length < 3) {
    return {
      overallScore: 50,
      sections: { clicheDensity: 50, burstiness: 50, transitionVariety: 50, sentenceLengthEvenness: 50 },
      flags: ["Not enough text to analyze (need 3+ sentences)."],
    };
  }

  const burstiness = calcBurstiness(sentences);
  const clicheDensity = 100 - calcClicheDensity(text, sentences);
  const transitionVariety = calcTransitionVariety(text, sentences.length);
  const evenness = calcEvenness(sentences);

  const overallScore = Math.round(
    burstiness * 0.35 + clicheDensity * 0.3 + transitionVariety * 0.2 + evenness * 0.15
  );

  const flags: string[] = [];
  if (burstiness < 30) flags.push("Sentence lengths are very uniform — human writing has more rhythm variation");
  if (clicheDensity < 40) flags.push("Heavy use of AI-typical phrases and cliches");
  if (transitionVariety < 30) flags.push("Overusing transition words (however, therefore, moreover)");
  if (evenness < 30) flags.push("Sentences are too evenly distributed — lacks natural peaks and valleys");

  return {
    overallScore,
    sections: {
      clicheDensity,
      burstiness,
      transitionVariety,
      sentenceLengthEvenness: evenness,
    },
    flags,
  };
}
