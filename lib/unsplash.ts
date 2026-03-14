/**
 * Unsplash API integration for content images
 */

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
  user: {
    name: string;
    username: string;
  };
  links: {
    download_location: string;
  };
}

export async function searchUnsplashImages(
  query: string,
  perPage: number = 6
): Promise<UnsplashImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API request failed');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
}

export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY) return;

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Error triggering Unsplash download:', error);
  }
}

export function getUnsplashMarkdown(image: UnsplashImage): string {
  const alt = image.alt_description || image.description || "Image";
  const attribution = `\n*Photo by [${image.user.name}](https://unsplash.com/@${image.user.username}?utm_source=pubwize&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=pubwize&utm_medium=referral)*\n`;
  return `\n![${alt}](${image.urls.regular})\n${attribution}`;
}

/**
 * Finds placeholders like [IMAGE_SUGGESTION: query] and replaces them with real Unsplash images.
 */
export async function injectImagesIntoMarkdown(markdown: string): Promise<string> {
  const regex = /\[IMAGE_SUGGESTION:\s*([^\]]+)\]/g;
  const matches = [...markdown.matchAll(regex)];

  if (matches.length === 0) return markdown;

  let processedMarkdown = markdown;

  // Process from last to first to keep indices valid if we were doing slice, 
  // but regex replace with unique strings is safer.
  for (const match of matches) {
    const fullTag = match[0];
    const query = match[1].trim();

    try {
      const images = await searchUnsplashImages(query, 1);
      if (images.length > 0) {
        const image = images[0];
        const replacement = getUnsplashMarkdown(image);
        processedMarkdown = processedMarkdown.replace(fullTag, replacement);

        // Trigger download tracking as per Unsplash API terms
        if (image.links?.download_location) {
          await triggerUnsplashDownload(image.links.download_location);
        }
      } else {
        // Remove placeholder if no image found
        processedMarkdown = processedMarkdown.replace(fullTag, "");
      }
    } catch (error) {
      console.error(`Failed to inject image for query "${query}":`, error);
      processedMarkdown = processedMarkdown.replace(fullTag, "");
    }
  }

  return processedMarkdown;
}

