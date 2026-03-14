import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore/collections';
import { withErrorHandler, assertValid, NotFoundError, ExternalServiceError } from '@/lib/error-handler';
import { authenticateRequest, validateRequestBody } from '@/lib/api-security';
import { withRateLimit } from '@/lib/rate-limit';
import { decryptPassword } from '@/lib/wordpress/encryption';

async function updateHandler(request: NextRequest) {
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  const body = await request.json();
  const validation = validateRequestBody(body, ['articleId', 'siteId', 'postId', 'title', 'content']);
  assertValid(validation.valid, validation.error || 'Invalid request');

  const { 
    articleId, 
    siteId, 
    postId,
    title, 
    content, 
    status = 'publish',
    categories = [],
    tags = [],
    featuredImageUrl
  } = body;

  const db = adminDb();

  // Get WordPress site
  const wpSiteRef = db.doc(`${COLLECTIONS.USERS}/${uid}/${SUBCOLLECTIONS.WORDPRESS_SITES}/${siteId}`);
  const wpSiteDoc = await wpSiteRef.get();

  if (!wpSiteDoc.exists) {
    throw new NotFoundError('WordPress site');
  }

  const wpSite = wpSiteDoc.data();
  assertValid(wpSite?.userId === uid, 'You don\'t have permission to use this WordPress site');

  // Get categories and tags IDs
  const { getCategories, getTags, createCategory } = await import('@/lib/wordpress/service');
  const wpSiteFormatted = {
    id: siteId,
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
    }
  }

  // Prepare update data
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

  // Update on WordPress
  try {
    const decryptedPassword = decryptPassword(wpSite.encryptedPassword);
    const cleanPassword = decryptedPassword.replace(/\s+/g, '');
    
    const wpResponse = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/posts/${postId}`, {
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
      console.error('WordPress update error:', error);
      throw new Error('Failed to update WordPress post');
    }

    const wpPost = await wpResponse.json();

    return NextResponse.json({
      success: true,
      postId: wpPost.id,
      postUrl: wpPost.link,
    });
  } catch (wpError) {
    console.error('WordPress API error:', wpError);
    throw new ExternalServiceError('WordPress', wpError);
  }
}

export const POST = withRateLimit(withErrorHandler(updateHandler), 'wordpress');
