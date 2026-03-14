import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { withErrorHandler, assertValid, NotFoundError, QuotaExceededError } from '@/lib/error-handler';
import { authenticateRequest, checkRateLimit, validateRequestBody } from '@/lib/api-security';
import { validateArticleId } from '@/lib/validation';
import { canPerformAction, incrementUsage } from '@/lib/usage-tracking';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Rate limit (30 req/min for article operations)
  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate request body
  const body = await request.json();
  const validation = validateRequestBody(body, ['articleId']);
  assertValid(validation.valid, validation.error || 'Invalid request');

  const { articleId } = body;

  // 4. Validate article ID
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  // 5. Check usage quota (duplicating counts as creating a new article)
  const db = adminDb();
  const usageCheck = await canPerformAction(db, uid, 'articles');
  
  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || 'Article limit reached',
      usageCheck.current || 0,
      usageCheck.limit || 0,
      'articles'
    );
  }

  // 6. Fetch and verify article
  const articleRef = db.collection(COLLECTIONS.ARTICLES).doc(articleId);
  const articleDoc = await articleRef.get();

  if (!articleDoc.exists) {
    throw new NotFoundError('Article');
  }

  const article = articleDoc.data();
  assertValid(article?.ownerId === uid, 'You don\'t have permission to duplicate this article');

  // 7. Create duplicate with new ID
  const newArticleRef = db.collection(COLLECTIONS.ARTICLES).doc();
  const duplicateData = {
    ...article,
    keyword: `${article.keyword} (Copy)`,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    wordPressPostId: null, // Reset WordPress data
    wordPressPostUrl: null,
    publishedAt: null,
    scheduledDate: null, // Reset schedule
  };

  await newArticleRef.set(duplicateData);

  // 8. Increment usage counter
  await incrementUsage(db, uid, 'articles');

  // 9. Return success
  return NextResponse.json({
    success: true,
    articleId: newArticleRef.id,
  });
});