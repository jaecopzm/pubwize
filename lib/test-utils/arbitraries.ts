import * as fc from 'fast-check';
import type {
  BriefData,
  OutlineData,
  DraftData,
  ArticleStatus,
  FirestoreTimestamp,
  ArticleDoc,
  SiteDoc,
} from '@/lib/types';

/**
 * Custom arbitraries for property-based testing with fast-check
 * These generators create random valid instances of domain types
 */

// Firestore Timestamp arbitrary
export function arbitraryFirestoreTimestamp(): fc.Arbitrary<FirestoreTimestamp> {
  return fc.record({
    seconds: fc.integer({ min: 1609459200, max: 2524608000 }), // 2021-2050
    nanoseconds: fc.integer({ min: 0, max: 999999999 }),
  });
}

// Article Status arbitrary
export function arbitraryArticleStatus(): fc.Arbitrary<ArticleStatus> {
  return fc.constantFrom(
    'draft',
    'brief',
    'outline',
    'draft',
    'optimized'
  );
}

// Brief Data arbitrary
export function arbitraryBriefData(): fc.Arbitrary<BriefData> {
  return fc.record({
    intent: fc.constantFrom('informational', 'commercial', 'transactional', 'navigational'),
    articleType: fc.constantFrom('how-to', 'listicle', 'guide', 'review', 'comparison'),
    headings: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 3, maxLength: 10 }),
    questions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { maxLength: 10 }),
    entities: fc.array(fc.string({ minLength: 2, maxLength: 50 }), { maxLength: 20 }),
    internalLinkIdeas: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 10 }),
    externalLinkIdeas: fc.array(fc.webUrl(), { maxLength: 10 }),
  });
}

// Outline Data arbitrary
export function arbitraryOutlineData(): fc.Arbitrary<OutlineData> {
  return fc.record({
    sections: fc.array(
      fc.record({
        heading: fc.string({ minLength: 5, maxLength: 100 }),
        notes: fc.option(fc.string({ maxLength: 500 })),
      }),
      { minLength: 3, maxLength: 15 }
    ),
  });
}

// Draft Data arbitrary
export function arbitraryDraftData(): fc.Arbitrary<DraftData> {
  return fc.record({
    content: fc.lorem({ maxCount: 500 }),
    format: fc.constantFrom('markdown', 'html'),
  });
}

// Article Document arbitrary
export function arbitraryArticleDoc(): fc.Arbitrary<Partial<ArticleDoc>> {
  return fc.record({
    ownerId: fc.uuid(),
    siteId: fc.uuid(),
    keyword: fc.string({ minLength: 3, maxLength: 100 }),
    status: arbitraryArticleStatus(),
    intent: fc.constantFrom('informational', 'commercial', 'transactional', 'navigational'),
    articleType: fc.constantFrom('how-to', 'listicle', 'guide', 'review', 'comparison'),
    brief: fc.option(arbitraryBriefData()),
    outline: fc.option(arbitraryOutlineData()),
    draft: fc.option(arbitraryDraftData()),
    settings: fc.record({
      tone: fc.constantFrom('professional', 'casual', 'friendly', 'authoritative'),
      targetWordCount: fc.option(fc.integer({ min: 500, max: 5000 })),
    }),
    createdAt: arbitraryFirestoreTimestamp(),
    updatedAt: arbitraryFirestoreTimestamp(),
  });
}

// Readability Score arbitrary
export function arbitraryReadabilityScore(): fc.Arbitrary<number> {
  return fc.double({ min: 0, max: 100, noNaN: true });
}

// WordPress Credentials arbitrary
export function arbitraryWordPressCredentials(): fc.Arbitrary<{
  url: string;
  username: string;
  password: string;
}> {
  return fc.record({
    url: fc.webUrl({ validSchemes: ['https'] }),
    username: fc.string({ minLength: 3, maxLength: 50 }),
    password: fc.string({ minLength: 16, maxLength: 64 }),
  });
}

// Content with minimum word count
export function arbitraryContentWithMinWords(minWords: number): fc.Arbitrary<string> {
  return fc.lorem({ maxCount: Math.max(minWords, 100) }).filter((text) => {
    const wordCount = text.split(/\s+/).length;
    return wordCount >= minWords;
  });
}

// Scheduled Date arbitrary (future dates only)
export function arbitraryScheduledDate(): fc.Arbitrary<Date> {
  const now = Date.now();
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;
  return fc.integer({ min: now, max: oneYearFromNow }).map((timestamp) => new Date(timestamp));
}

// Version Snapshot arbitrary
export function arbitraryVersionSnapshot(): fc.Arbitrary<{
  id: string;
  articleId: string;
  userId: string;
  timestamp: FirestoreTimestamp;
  changeDescription: string;
  contentType: 'brief' | 'outline' | 'draft';
}> {
  return fc.record({
    id: fc.uuid(),
    articleId: fc.uuid(),
    userId: fc.uuid(),
    timestamp: arbitraryFirestoreTimestamp(),
    changeDescription: fc.string({ minLength: 5, maxLength: 200 }),
    contentType: fc.constantFrom('brief', 'outline', 'draft'),
  });
}

// Unsplash Image arbitrary
export function arbitraryUnsplashImage(): fc.Arbitrary<{
  id: string;
  urls: { regular: string; small: string; thumb: string };
  photographer: { name: string; username: string; profileUrl: string };
}> {
  return fc.record({
    id: fc.uuid(),
    urls: fc.record({
      regular: fc.webUrl(),
      small: fc.webUrl(),
      thumb: fc.webUrl(),
    }),
    photographer: fc.record({
      name: fc.string({ minLength: 5, maxLength: 50 }),
      username: fc.string({ minLength: 3, maxLength: 30 }),
      profileUrl: fc.webUrl(),
    }),
  });
}

// Keyboard Shortcut arbitrary
export function arbitraryKeyboardShortcut(): fc.Arbitrary<string> {
  const modifiers = fc.constantFrom('Ctrl', 'Cmd', 'Alt', 'Shift');
  const keys = fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '/', '\\', '[', ']', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0');
  
  return fc.tuple(modifiers, keys).map(([mod, key]) => `${mod}+${key}`);
}

// Template Structure arbitrary
export function arbitraryTemplateStructure(): fc.Arbitrary<{
  headings: string[];
  placeholders: Record<string, string>;
}> {
  return fc.record({
    headings: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 3, maxLength: 10 }),
    placeholders: fc.dictionary(
      fc.string({ minLength: 3, maxLength: 30 }),
      fc.string({ minLength: 10, maxLength: 200 }),
      { minKeys: 1, maxKeys: 10 }
    ),
  });
}
