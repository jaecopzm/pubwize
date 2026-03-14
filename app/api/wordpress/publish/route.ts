import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore/collections';
import { withErrorHandler, assertValid, NotFoundError, ExternalServiceError } from '@/lib/error-handler';
import { authenticateRequest, checkRateLimit, validateRequestBody } from '@/lib/api-security';
import { validateArticleId } from '@/lib/validation';
import { withRateLimit } from '@/lib/rate-limit';
import { invalidateArticleCache } from '@/lib/cache-invalidation';
import { logger } from '@/lib/logger';
import { decryptPassword } from '@/lib/wordpress/encryption';

async function publishHandler(request: NextRequest) {
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Rate limit (10 req/min for WordPress publishing - external API)
  const rateLimit = checkRateLimit(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many publish requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate request body
  const body = await request.json();
  const validation = validateRequestBody(body, ['articleId', 'wordPressSiteId', 'title', 'content']);
  assertValid(validation.valid, validation.error || 'Invalid request');

  const { 
    articleId, 
    wordPressSiteId, 
    title, 
    content, 
    status = 'draft',
    categories = [],
    tags = [],
    featuredImageUrl,
    scheduledDate
  } = body;

  // 4. Validate article ID
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  const db = adminDb();

  // 5. Get and verify article
  const articleRef = db.collection(COLLECTIONS.ARTICLES).doc(articleId);
  const articleDoc = await articleRef.get();

  if (!articleDoc.exists) {
    throw new NotFoundError('Article');
  }

  const article = articleDoc.data();
  assertValid(article?.ownerId === uid, 'You don\'t have permission to publish this article');

  // 6. Get and verify WordPress site credentials
  const wpSiteRef = db.doc(`${COLLECTIONS.USERS}/${uid}/${SUBCOLLECTIONS.WORDPRESS_SITES}/${wordPressSiteId}`);
  const wpSiteDoc = await wpSiteRef.get();

  if (!wpSiteDoc.exists) {
    throw new NotFoundError('WordPress site');
  }

  const wpSite = wpSiteDoc.data();
  assertValid(wpSite?.userId === uid, 'You don\'t have permission to use this WordPress site');

  // 7. Get WordPress categories and tags, convert names to IDs
  const { getCategories, getTags, createCategory } = await import('@/lib/wordpress/service');
  const wpSiteFormatted = {
    id: wordPressSiteId,
    siteUrl: wpSite.siteUrl,
    username: wpSite.username,
    encryptedPassword: wpSite.encryptedPassword,
  } as any;

  const categoryIds: number[] = [];
  if (categories && categories.length > 0) {
    const existingCategories = await getCategories(wpSiteFormatted);
    
    for (const categoryName of categories) {
      const existing = existingCategories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (existing) {
        categoryIds.push(existing.id);
      } else {
        const newCategoryId = await createCategory(wpSiteFormatted, categoryName);
        categoryIds.push(newCategoryId);
      }
    }
  }

  const tagIds: number[] = [];
  if (tags && tags.length > 0) {
    const existingTags = await getTags(wpSiteFormatted);
    
    for (const tagName of tags) {
      const existing = existingTags.find(
        (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
      );
      
      if (existing) {
        tagIds.push(existing.id);
      }
      // Note: WordPress doesn't allow creating tags via REST API, skip if not found
    }
  }

  // 8. Prepare WordPress post data
  const postData: any = {
    title,
    content,
    status,
  };

  if (categoryIds.length > 0) {
    postData.categories = categoryIds;
  }

  if (tagIds.length > 0) {
    postData.tags = tagIds;
  }

  // Add scheduled date if provided
  if (status === 'future' && scheduledDate) {
    postData.date = scheduledDate;
  }

  // 9. Add featured image if available
  if (featuredImageUrl) {
    try {
      const { uploadFeaturedImage } = await import('@/lib/wordpress/service');
      const decryptedPassword = decryptPassword(wpSite.encryptedPassword);
      const cleanPassword = decryptedPassword.replace(/\s+/g, '');
      
      const mediaId = await uploadFeaturedImage(
        { 
          siteUrl: wpSite.siteUrl, 
          username: wpSite.username, 
          encryptedPassword: wpSite.encryptedPassword 
        } as any,
        featuredImageUrl,
        title
      );
      if (mediaId) {
        postData.featured_media = mediaId;
      }
    } catch (imgError) {
      console.warn('Featured image upload failed:', imgError);
      // Continue without featured image
    }
  }

  // 9. Publish to WordPress
  let wpPost;
  try {
    // Decrypt and clean the password
    const decryptedPassword = decryptPassword(wpSite.encryptedPassword);
    const cleanPassword = decryptedPassword.replace(/\s+/g, '');
    
    const wpResponse = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${wpSite.username}:${cleanPassword}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(postData),
    });

    if (!wpResponse.ok) {
      const error = await wpResponse.text();
      console.error('WordPress publish error:', error);
      throw new Error('Failed to publish to WordPress');
    }

    wpPost = await wpResponse.json();
  } catch (wpError) {
    console.error('WordPress API error:', wpError);
    throw new ExternalServiceError('WordPress', wpError);
  }

  // 10. Update article with WordPress post ID
  await articleRef.update({
    wordPressPostId: wpPost.id,
    wordPressPostUrl: wpPost.link,
    publishedAt: new Date(),
    publishedToSite: wordPressSiteId,
  });

  // Invalidate article cache
  await invalidateArticleCache(articleId, uid);

  logger.info('Article published to WordPress', { 
    articleId, 
    userId: uid, 
    wpSiteId: wordPressSiteId,
    wpPostId: wpPost.id 
  });

  // 11. Return success
  return NextResponse.json({
    success: true,
    postId: wpPost.id,
    postUrl: wpPost.link,
  });
}

export const POST = withRateLimit(
  withErrorHandler(publishHandler),
  'wordpress'
);
async function uploadFeaturedImage(
  siteUrl: string,
  username: string,
  password: string,
  imageUrl: string,
  title: string
): Promise<number | undefined> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return undefined;

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';

    // Upload to WordPress
    const uploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '-')}.${extension}"`,
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) return undefined;

    const media = await uploadResponse.json();
    return media.id;
  } catch (error) {
    console.error('Error uploading featured image:', error);
    return undefined;
  }
}
