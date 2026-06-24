export type PlanTier = "none" | "starter" | "pro";

export type PlanStatus = "active" | "trialing" | "canceled" | "past_due";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "on_hold"
  | "paused"
  | "cancelled"
  | "failed"
  | "expired";

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export interface UserDoc {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  planTier: PlanTier;
  planStatus: PlanStatus;
  paddleCustomerId?: string | null;
  paddleSubscriptionId?: string | null;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelledAt?: string | null;
  articleCountThisPeriod: number;
  periodStart: FirestoreTimestamp;
  periodEnd: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  emailPreferences?: EmailPreferences;
  unsubscribedAt?: string;
  // brandVoice is now stored at the site level; user documents no longer
  // contain any persona information.
}

export interface EmailPreferences {
  marketing: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
  transactional: boolean;
}

// The site-level brand voice contains both a short list of adjectives used
// for quick tone hints and optional richer persona fields.  When an article
// is generated we pass the full object to the AI so it can combine the
// adjectives with the tone/target‑audience/formatting rules if supplied.
export interface SiteBrandVoice {
  adjectives: string[];
  examples?: string[];
  tone?: string;
  targetAudience?: string;
  formattingRules?: string;
  expertPersona?: string;
}

export interface SiteDoc {
  ownerId: string;
  domain: string;
  siteName: string;
  niche: string;
  targetCountry: string;
  language: string;
  brandVoice: SiteBrandVoice;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface BriefData {
  intent: string;
  articleType: string;
  headings: string[];
  questions: string[];
  entities: string[];
  internalLinkIdeas: string[];
  externalLinkIdeas: string[];
  competitorInsights?: {
    commonTopics: string[];
    headingPatterns: string[];
    contentGaps: string[];
    sentiment?: string;
  };
  informationGain?: string[];
  eeatOpportunities?: string[];
}

export interface OutlineSection {
  heading: string;
  level?: 2 | 3;
  notes?: string;
  answerTarget?: string | null;
  isFaq?: boolean;
}

export interface OutlineData {
  sections: OutlineSection[];
  structuralLogic?: string;
}

export type DraftFormat = "markdown" | "html";

export interface DraftData {
  content: string;
  format: DraftFormat;
}

export interface OptimizationData {
  suggestions: string[];
  lsiKeywords?: string[];
  suggestedTitle?: string;
  suggestedMetaDescription?: string;
  schemaSuggestions?: string[];
  generatedSchema?: string; // JSON-LD blocks
  internalLinkingNotes?: string;
  internalLinks?: Array<{
    anchorText: string;
    targetArticleId: string;
    targetArticleTitle: string;
    targetArticleUrl: string;
    context: string;
  }>;
  appliedAt?: FirestoreTimestamp;
  aiDetection?: {
    score: number;
    riskLevel?: string;
    humanLikePercentage?: number;
    uniqueness?: number;
  };
  readabilityScore?: number;
  seoScore?: number;
}

export interface SocialMediaData {
  twitter: string[];
  linkedin: string[];
  instagram: string[];
  facebook: string[];
  hashtags: string[];
  generatedAt: FirestoreTimestamp;
}

export type ArticleStatus =
  | "draft"
  | "brief"
  | "outline"
  | "optimized";

export interface ArticleSettings {
  tone: string;
  targetWordCount?: number | null;
  niche?: string;
  targetCountry?: string;
  language?: string;
}

export interface ArticleDoc {
  ownerId: string;
  siteId: string;
  keyword: string;
  status: ArticleStatus;
  intent: string;
  articleType: string;
  brief: BriefData | null;
  outline: OutlineData | null;
  draft: DraftData | null;
  optimizations?: OptimizationData | null;
  settings: ArticleSettings;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;

  // Premium features - Content Calendar
  scheduledDate?: FirestoreTimestamp | null;

  // Premium features - Image Integration
  featuredImage?: {
    url: string;
    photographer: string;
    photographerUrl: string;
    unsplashId: string;
  } | null;

  // Premium features - SEO & SERP Preview
  metaTitle?: string;
  metaDescription?: string;

  // Premium features - WordPress Publishing
  wordPressPostId?: number | null;
  wordPressSiteId?: string | null;
  publishedUrl?: string | null;

  // Premium features - Templates
  templateId?: string | null;
}

export interface GenerateBriefRequestBody {
  keyword: string;
  siteId: string;
  tone?: string;
  targetWordCount?: number;
}

export interface GenerateBriefResponse {
  articleId: string;
  brief: BriefData;
  intent: string;
  articleType: string;
}


// Premium Features - Version History

export interface VersionSnapshot {
  id: string;
  articleId: string;
  userId: string;
  timestamp: FirestoreTimestamp;
  changeDescription: string;
  contentType: 'brief' | 'outline' | 'draft';
  snapshot: {
    brief?: BriefData;
    outline?: OutlineData;
    draft?: DraftData;
    settings?: ArticleSettings;
  };
  archived: boolean;
}

// Premium Features - Content Calendar

export interface CalendarEvent {
  id: string;
  articleId: string;
  title: string;
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  scheduledDate: Date;
}

// Premium Features - Readability Analysis

export interface ReadabilityScores {
  fleschKincaidReadingEase: number;
  fleschKincaidGradeLevel: number;
  hemingwayScore: number;
  ratings: {
    readingEase: 'poor' | 'fair' | 'good' | 'excellent';
    gradeLevel: 'poor' | 'fair' | 'good' | 'excellent';
    hemingway: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

export interface ReadabilityIssue {
  type: 'long_sentence' | 'complex_word' | 'long_paragraph';
  location: { start: number; end: number };
  text: string;
  suggestion: string;
}

// Premium Features - Competitor Analysis

export interface CompetitorArticle {
  url: string;
  title: string;
  wordCount: number;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  keyTopics: string[];
  domain: string;
}

export interface CompetitorAnalysisResult {
  keyword: string;
  articles: CompetitorArticle[];
  insights: {
    averageWordCount: number;
    commonTopics: string[];
    headingPatterns: string[];
    recommendations: string[];
  };
}

// Premium Features - AI Detection

export interface AIDetectionResult {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  patterns: {
    repetitivePhrasing: number;
    uniformSentenceStructure: number;
    lackOfPersonalVoice: number;
  };
  suggestions: HumanizationSuggestion[];
}

export interface HumanizationSuggestion {
  type: 'add_anecdote' | 'vary_structure' | 'add_contractions' | 'add_personality';
  description: string;
  example: string;
  location?: { start: number; end: number };
}

// Premium Features - WordPress Publishing

export interface WordPressSite {
  id: string;
  userId: string;
  siteUrl: string;
  siteName: string;
  username: string;
  encryptedPassword: string; // Application password
  connected: boolean;
  lastPublished?: FirestoreTimestamp;
  lastValidated?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface WordPressPublishOptions {
  status: 'draft' | 'pending' | 'publish' | 'future';
  categories: string[];
  tags: string[];
  featuredImageUrl?: string;
  scheduledDate?: Date;
  customFields?: Record<string, any>;
}

export interface WordPressPublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
  retryCount?: number;
}

export interface WordPressPublishHistory {
  id: string;
  articleId: string;
  siteId: string;
  postId?: number;
  postUrl?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  publishedAt: FirestoreTimestamp;
  retryCount: number;
}

// Premium Features - Unsplash Images

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  photographer: {
    name: string;
    username: string;
    profileUrl: string;
  };
  description?: string;
  altDescription?: string;
}

// Premium Features - Internal Linking

export interface InternalLinkSuggestion {
  id?: string;
  anchorText: string;
  targetArticleId: string;
  targetArticleTitle: string;
  targetArticleUrl: string;
  position?: { start: number; end: number };
  relevanceScore?: number;
  context: string; // Surrounding text
}

// Premium Features - SERP Preview

export interface SERPPreviewData {
  title: string;
  metaDescription: string;
  url: string;
  titleLength: number;
  descriptionLength: number;
  titleTruncated: boolean;
  descriptionTruncated: boolean;
}

// Premium Features - Schema Markup

export interface SchemaMarkup {
  type: 'Article' | 'FAQPage' | 'HowTo';
  jsonLd: string;
  valid: boolean;
  errors?: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

// Premium Features - Keyboard Shortcuts

export interface KeyboardShortcut {
  id: string;
  action: string;
  defaultKey: string;
  customKey?: string;
  description: string;
  category: 'navigation' | 'editing' | 'workflow';
}

export interface UserShortcuts {
  userId: string;
  shortcuts: {
    [actionId: string]: string; // Custom key binding
  };
  updatedAt: FirestoreTimestamp;
}

// Premium Features - Article Templates

export interface ArticleTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  structure: {
    headings: string[];
    placeholders: { [key: string]: string };
    defaultSettings?: Partial<ArticleSettings>;
  };
  usageCount: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// Premium Features - Export

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown';
  includeImages: boolean;
  includeMetadata: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
}
