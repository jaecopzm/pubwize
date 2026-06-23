const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  likes: number;
  user: {
    name: string;
    username: string;
  };
  links: {
    download_location: string;
  };
}

const STOP_WORDS = new Set([
  "this", "that", "with", "from", "they", "their", "them", "have", "been",
  "will", "would", "could", "should", "more", "some", "than", "also", "very",
  "just", "about", "what", "when", "where", "which", "there", "these", "those",
  "because", "before", "after", "into", "over", "such", "only", "other",
  "than", "then", "them", "each", "your", "first", "second", "last", "most",
  "much", "many", "well", "here", "even", "still", "already", "while",
]);

function significantWords(text: string, max: number): string[] {
  return text
    .replace(/[#*_~\[\](){}>|]/g, " ")
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z0-9-]/g, ""))
    .filter(w => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, max);
}

/**
 * Extract ~120 chars of surrounding text for a match at a given position.
 */
function extractContext(markdown: string, matchStart: number, matchEnd: number): string {
  const before = markdown.slice(Math.max(0, matchStart - 120), matchStart);
  const after = markdown.slice(matchEnd, matchEnd + 120);
  return (before + " " + after).replace(/\s+/g, " ").trim();
}

/**
 * Build an enriched search query by combining the AI's suggestion with
 * meaningful nouns from the surrounding paragraph context.
 */
function enhanceQuery(baseQuery: string, context: string): string {
  const words = significantWords(context, 6);
  if (words.length === 0) return baseQuery;
  return `${baseQuery} ${words.join(" ")}`;
}

/**
 * Append Unsplash image-optimisation parameters.
 * https://docs.imgix.com/apis/rendering
 */
function optimizeUrl(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=1200&q=80&auto=format&fit=crop`;
}

/**
 * Generate a descriptive alt-text from the best available signal.
 */
function buildAltText(image: UnsplashImage, originalQuery: string): string {
  const alt = image.alt_description || image.description;
  if (alt) return alt.charAt(0).toUpperCase() + alt.slice(1);
  return originalQuery.charAt(0).toUpperCase() + originalQuery.slice(1);
}

export async function searchUnsplashImages(
  query: string,
  perPage: number = 6
): Promise<UnsplashImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash API key not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&order_by=relevant`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error("Unsplash API request failed");
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching Unsplash images:", error);
    return [];
  }
}

export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
  } catch (error) {
    console.error("Error triggering Unsplash download:", error);
  }
}

export function pickBestImage(images: UnsplashImage[]): UnsplashImage {
  return images.reduce((best, img) =>
    (img.likes || 0) > (best.likes || 0) ? img : best
  );
}

export function getUnsplashMarkdown(image: UnsplashImage, altText: string): string {
  const url = optimizeUrl(image.urls.regular);
  const attribution = `\n*Photo by [${image.user.name}](https://unsplash.com/@${image.user.username}?utm_source=pubwize&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=pubwize&utm_medium=referral)*\n`;
  return `\n![${altText}](${url})\n${attribution}`;
}

/**
 * Finds [IMAGE_SUGGESTION: query] placeholders and replaces them with
 * high-quality, contextually-relevant, optimised Unsplash images.
 */
export async function injectImagesIntoMarkdown(markdown: string): Promise<string> {
  const regex = /\[IMAGE_SUGGESTION:\s*([^\]]+)\]/g;
  const matches = [...markdown.matchAll(regex)];

  if (matches.length === 0) return markdown;

  let result = markdown;

  for (const match of matches) {
    const fullTag = match[0];
    const query = match[1].trim();
    const context = extractContext(markdown, match.index!, match.index! + fullTag.length);
    const enrichedQuery = enhanceQuery(query, context);

    try {
      const images = await searchUnsplashImages(enrichedQuery, 5);
      if (images.length > 0) {
        const best = pickBestImage(images);
        const altText = buildAltText(best, query);
        const replacement = getUnsplashMarkdown(best, altText);
        result = result.replace(fullTag, replacement);

        if (best.links?.download_location) {
          await triggerUnsplashDownload(best.links.download_location);
        }
      } else {
        result = result.replace(fullTag, "");
      }
    } catch (error) {
      console.error(`Failed to inject image for query "${query}":`, error);
      result = result.replace(fullTag, "");
    }
  }

  return result;
}
