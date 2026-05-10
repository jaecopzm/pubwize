/**
 * WordPress Service Module
 * Handles WordPress site connections, validation, and content operations
 */

import { encryptPassword, decryptPassword } from "./encryption";
import type { WordPressSite, WordPressPublishOptions, WordPressPublishResult } from "@/lib/types";

export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  password: string; // Application password
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  status: string;
  link: string;
  date: string;
  modified: string;
}

export interface WordPressMediaUpload {
  id: number;
  source_url: string;
  title: string;
}

// Cache for categories and tags (5 minutes TTL)
const categoryCache = new Map<string, { data: WordPressCategory[]; timestamp: number }>();
const tagCache = new Map<string, { data: WordPressTag[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate WordPress credentials by attempting to authenticate
 */
export async function validateCredentials(
  credentials: WordPressCredentials
): Promise<{ valid: boolean; siteName?: string; error?: string }> {
  try {
    const { siteUrl, username, password } = credentials;

    // Normalize site URL
    const normalizedUrl = normalizeSiteUrl(siteUrl);

    // Remove spaces from password
    const cleanPassword = password.replace(/\s+/g, '');

    // Create Basic Auth header
    const authHeader = createAuthHeader(username, cleanPassword);

    console.log("Testing WordPress connection:", {
      url: normalizedUrl,
      username,
      passwordLength: cleanPassword.length,
    });

    // First, check if REST API is accessible
    const apiCheckResponse = await fetch(`${normalizedUrl}/wp-json`, {
      method: "GET",
    });

    if (!apiCheckResponse.ok) {
      return {
        valid: false,
        error: "WordPress REST API is not accessible. Check if the site is online and REST API is enabled.",
      };
    }

    // Test connection by fetching site info
    const response = await fetch(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("WordPress validation failed:", {
        status: response.status,
        statusText: response.statusText,
        url: `${normalizedUrl}/wp-json/wp/v2/users/me`,
        error: errorText,
        authHeaderLength: authHeader.length,
      });

      if (response.status === 401) {
        return { valid: false, error: "Invalid username or application password. Make sure you're using an Application Password (not your regular WordPress password). Also verify the username is correct." };
      }
      if (response.status === 404) {
        return { valid: false, error: "WordPress REST API not found. Ensure the site has REST API enabled." };
      }
      return {
        valid: false,
        error: `Connection failed: ${response.statusText}`,
      };
    }

    // Fetch site name
    const siteResponse = await fetch(`${normalizedUrl}/wp-json`, {
      method: "GET",
    });

    let siteName = normalizedUrl;
    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      siteName = siteData.name || normalizedUrl;
    }

    return { valid: true, siteName };
  } catch (error) {
    console.error("WordPress validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Get categories from WordPress site (with caching)
 */
export async function getCategories(
  site: WordPressSite,
  forceRefresh = false
): Promise<WordPressCategory[]> {
  try {
    const cacheKey = `${site.id}-categories`;
    
    // Check cache
    if (!forceRefresh) {
      const cached = categoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    const response = await fetch(
      `${normalizedUrl}/wp-json/wp/v2/categories?per_page=100`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const categories = await response.json();
    const result = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));

    // Update cache
    categoryCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

/**
 * Get tags from WordPress site (with caching)
 */
export async function getTags(
  site: WordPressSite,
  forceRefresh = false
): Promise<WordPressTag[]> {
  try {
    const cacheKey = `${site.id}-tags`;
    
    // Check cache
    if (!forceRefresh) {
      const cached = tagCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    const response = await fetch(
      `${normalizedUrl}/wp-json/wp/v2/tags?per_page=100`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const tags = await response.json();
    const result = tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));

    // Update cache
    tagCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

/**
 * Create a tag if it doesn't exist
 */
export async function createTag(
  site: WordPressSite,
  tagName: string
): Promise<number> {
  try {
    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    const response = await fetch(`${normalizedUrl}/wp-json/wp/v2/tags`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, "-"),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create tag: ${response.statusText}`);
    }

    const tag = await response.json();
    return tag.id;
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
}

/**
 * Create a category if it doesn't exist
 */
export async function createCategory(
  site: WordPressSite,
  categoryName: string
): Promise<number> {
  try {
    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    const response = await fetch(`${normalizedUrl}/wp-json/wp/v2/categories`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.statusText}`);
    }

    const category = await response.json();
    return category.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

/**
 * Upload featured image to WordPress
 */
export async function uploadFeaturedImage(
  site: WordPressSite,
  imageUrl: string,
  title: string
): Promise<number | null> {
  try {
    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const filename = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${extension}`;

    // Upload to WordPress
    const uploadResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        Authorization: authHeader,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({}));
      throw new Error(error.message || "Failed to upload image");
    }

    const media: WordPressMediaUpload = await uploadResponse.json();
    return media.id;
  } catch (error) {
    console.error("Error uploading featured image:", error);
    return null;
  }
}

/**
 * Update existing WordPress post
 */
export async function updateWordPressPost(
  site: WordPressSite,
  postId: number,
  title: string,
  content: string,
  options: WordPressPublishOptions
): Promise<WordPressPublishResult> {
  try {
    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    // Get or create categories
    const categoryIds: number[] = [];
    if (options.categories.length > 0) {
      const existingCategories = await getCategories(site);
      
      for (const categoryName of options.categories) {
        const existing = existingCategories.find(
          (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (existing) {
          categoryIds.push(existing.id);
        } else {
          const newCategoryId = await createCategory(site, categoryName);
          categoryIds.push(newCategoryId);
        }
      }
    }

    // Get or create tags
    const tagIds: number[] = [];
    if (options.tags.length > 0) {
      const existingTags = await getTags(site);
      for (const tagName of options.tags) {
        const existing = existingTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
        if (existing) {
          tagIds.push(existing.id);
        } else {
          const newTagId = await createTag(site, tagName);
          tagIds.push(newTagId);
        }
      }
    }

    // Prepare post data
    const postData: any = {
      title,
      content,
      status: options.status,
    };

    if (categoryIds.length > 0) {
      postData.categories = categoryIds;
    }

    if (tagIds.length > 0) postData.tags = tagIds;

    if (options.featuredImageUrl) {
      const mediaId = await uploadFeaturedImage(site, options.featuredImageUrl, title);
      if (mediaId) {
        postData.featured_media = mediaId;
      }
    }

    // Update post
    const response = await fetch(
      `${normalizedUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update post: ${response.statusText}`
      );
    }

    const post = await response.json();

    return {
      success: true,
      postId: post.id,
      postUrl: post.link,
    };
  } catch (error) {
    console.error("WordPress update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
  }
}

/**
 * Check connection health
 */
export async function checkConnectionHealth(
  site: WordPressSite
): Promise<{ healthy: boolean; error?: string }> {
  try {
    const normalizedUrl = normalizeSiteUrl(site.siteUrl);
    const authHeader = createAuthHeader(
      site.username,
      decryptPassword(site.encryptedPassword)
    );

    const response = await fetch(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { healthy: false, error: "Authentication failed" };
      }
      return { healthy: false, error: `Connection failed: ${response.statusText}` };
    }

    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
/**
 * Publish article to WordPress (with retry logic)
 */
export async function publishToWordPress(
  site: WordPressSite,
  title: string,
  content: string,
  options: WordPressPublishOptions,
  maxRetries = 3
): Promise<WordPressPublishResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const normalizedUrl = normalizeSiteUrl(site.siteUrl);
      const authHeader = createAuthHeader(
        site.username,
        decryptPassword(site.encryptedPassword)
      );

      // Get or create categories
      const categoryIds: number[] = [];
      if (options.categories.length > 0) {
        const existingCategories = await getCategories(site);
        
        for (const categoryName of options.categories) {
          const existing = existingCategories.find(
            (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
          );
          
          if (existing) {
            categoryIds.push(existing.id);
          } else {
            const newCategoryId = await createCategory(site, categoryName);
            categoryIds.push(newCategoryId);
          }
        }
      }

      // Get or create tags
      const tagIds: number[] = [];
      if (options.tags.length > 0) {
        const existingTags = await getTags(site);
        for (const tagName of options.tags) {
          const existing = existingTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
          if (existing) {
            tagIds.push(existing.id);
          } else {
            const newTagId = await createTag(site, tagName);
            tagIds.push(newTagId);
          }
        }
      }

      // Prepare post data
      const postData: any = {
        title,
        content,
        status: options.status,
      };

      if (categoryIds.length > 0) {
        postData.categories = categoryIds;
      }

      if (tagIds.length > 0) postData.tags = tagIds;

      // Handle scheduled publishing
      if (options.scheduledDate) {
        postData.date = options.scheduledDate.toISOString();
        postData.status = "future";
      }

      // Upload featured image if provided
      if (options.featuredImageUrl) {
        const mediaId = await uploadFeaturedImage(site, options.featuredImageUrl, title);
        if (mediaId) {
          postData.featured_media = mediaId;
        }
      }

      // Create post
      const response = await fetch(`${normalizedUrl}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to publish: ${response.statusText}`
        );
      }

      const post = await response.json();

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`WordPress publish attempt ${attempt} failed:`, error);

      // Don't retry on authentication errors
      if (lastError.message.includes("401") || lastError.message.includes("Authentication")) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Failed to publish after multiple attempts",
  };
}

/**
 * Normalize site URL (ensure it has protocol and no trailing slash)
 */
function normalizeSiteUrl(url: string): string {
  let normalized = url.trim();

  // Add https:// if no protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  return normalized;
}

/**
 * Create Basic Auth header
 */
function createAuthHeader(username: string, password: string): string {
  // Remove spaces from application password (WordPress adds spaces for readability)
  const cleanPassword = password.replace(/\s+/g, '');
  const credentials = Buffer.from(`${username}:${cleanPassword}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Encrypt and prepare site data for storage
 */
export function prepareSiteForStorage(
  credentials: WordPressCredentials,
  userId: string,
  siteName: string
): Omit<WordPressSite, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    siteUrl: normalizeSiteUrl(credentials.siteUrl),
    siteName,
    username: credentials.username,
    encryptedPassword: encryptPassword(credentials.password),
    connected: true,
    lastValidated: {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    },
  };
}
