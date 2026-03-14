import type {
  ArticleDoc,
  BriefData,
  OutlineData,
  DraftData,
  FirestoreTimestamp,
  SiteDoc,
} from '@/lib/types';

/**
 * Test fixtures for consistent test data
 */

export function createMockTimestamp(date?: Date): FirestoreTimestamp {
  const d = date || new Date();
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1000000,
  };
}

export function createMockBriefData(overrides?: Partial<BriefData>): BriefData {
  return {
    intent: 'informational',
    articleType: 'how-to',
    headings: [
      'Introduction',
      'What is the topic?',
      'How to get started',
      'Best practices',
      'Conclusion',
    ],
    questions: [
      'What is the main benefit?',
      'How long does it take?',
      'What tools do I need?',
    ],
    entities: ['tool', 'method', 'process', 'result'],
    internalLinkIdeas: ['Related article 1', 'Related article 2'],
    externalLinkIdeas: ['https://example.com/resource1', 'https://example.com/resource2'],
    ...overrides,
  };
}

export function createMockOutlineData(overrides?: Partial<OutlineData>): OutlineData {
  return {
    sections: [
      { heading: 'Introduction', notes: 'Hook the reader' },
      { heading: 'Main Point 1', notes: 'Explain the first concept' },
      { heading: 'Main Point 2', notes: 'Explain the second concept' },
      { heading: 'Conclusion', notes: 'Summarize key takeaways' },
    ],
    ...overrides,
  };
}

export function createMockDraftData(overrides?: Partial<DraftData>): DraftData {
  return {
    content: `# Test Article

This is a test article with some content. It has multiple paragraphs and demonstrates the structure of a typical article.

## Section 1

Here is some content for section 1. This section explains an important concept.

## Section 2

Here is some content for section 2. This section builds on the previous one.

## Conclusion

This is the conclusion of the article.`,
    format: 'markdown',
    ...overrides,
  };
}

export function createMockArticleDoc(overrides?: Partial<ArticleDoc>): ArticleDoc {
  const now = createMockTimestamp();
  return {
    ownerId: 'test-user-id',
    siteId: 'test-site-id',
    keyword: 'test keyword',
    status: 'draft',
    intent: 'informational',
    articleType: 'how-to',
    brief: null,
    outline: null,
    draft: null,
    optimizations: null,
    settings: {
      tone: 'professional',
      targetWordCount: 1500,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockSiteDoc(overrides?: Partial<SiteDoc>): SiteDoc {
  const now = createMockTimestamp();
  return {
    ownerId: 'test-user-id',
    domain: 'https://example.com',
    siteName: 'Test Site',
    niche: 'Technology',
    targetCountry: 'US',
    language: 'en',
    brandVoice: {
      adjectives: ['professional', 'informative', 'friendly'],
      examples: ['Example 1', 'Example 2'],
      tone: 'professional',
      targetAudience: 'Developers building SaaS products',
      formattingRules: '- Use short paragraphs\n- Avoid technical jargon when possible',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Sample content for testing readability
export const SAMPLE_CONTENT = {
  SHORT: 'This is a short text with less than 100 words.',

  MEDIUM: `This is a medium-length text for testing readability. It contains multiple sentences with varying complexity. Some sentences are short. Others are longer and contain more complex vocabulary and structure. This helps test the readability algorithms properly.

The text spans multiple paragraphs to simulate real content. Each paragraph contributes to the overall readability score. The goal is to have enough content to generate meaningful metrics.

Finally, we conclude with a summary paragraph that ties everything together.`,

  LONG: `This is a comprehensive article about an important topic. The introduction sets the stage for what's to come and engages the reader with interesting facts and questions.

The first main section delves into the core concepts. We explore various aspects of the topic, providing detailed explanations and examples. Each point builds upon the previous one, creating a logical flow of information.

In the second section, we examine practical applications. Real-world scenarios help illustrate how these concepts work in practice. We discuss common challenges and provide solutions based on best practices.

The third section focuses on advanced techniques. For readers who want to go deeper, we explore sophisticated approaches and methodologies. These techniques require more expertise but offer significant benefits.

Throughout the article, we maintain a balance between accessibility and depth. The language is clear and concise, avoiding unnecessary jargon while still being technically accurate. Examples and analogies help clarify complex ideas.

The conclusion summarizes the key takeaways and provides actionable next steps. Readers should feel empowered to apply what they've learned. Additional resources are provided for those who want to continue their learning journey.`,

  COMPLEX: `The implementation of sophisticated algorithmic paradigms necessitates comprehensive understanding of multifaceted computational methodologies. Consequently, practitioners must familiarize themselves with intricate theoretical frameworks and their practical ramifications.

Furthermore, the juxtaposition of heterogeneous architectural patterns facilitates optimization of performance characteristics. Nevertheless, such implementations require meticulous consideration of numerous interdependent variables and their synergistic relationships.

Ultimately, the synthesis of these methodological approaches culminates in robust, scalable solutions that accommodate diverse operational requirements while maintaining architectural integrity.`,
};
