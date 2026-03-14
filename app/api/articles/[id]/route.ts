import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore/collections';
import { withErrorHandler, assertValid, NotFoundError } from '@/lib/error-handler';
import { authenticateRequest, checkRateLimit } from '@/lib/api-security';
import { validateArticleId } from '@/lib/validation';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Rate limit (120 req/min for read operations)
  const rateLimit = checkRateLimit(uid, 120, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate article ID
  const { id: articleId } = await params;
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  // 4. Fetch article
  const db = adminDb();
  const articleDoc = await db.collection(COLLECTIONS.ARTICLES).doc(articleId).get();

  if (!articleDoc.exists) {
    throw new NotFoundError('Article');
  }

  // 5. Verify ownership
  const article = articleDoc.data();
  assertValid(article?.ownerId === uid, 'You don\'t have permission to access this article');

  // 6. Return success
  return NextResponse.json({ article: { id: articleDoc.id, ...article } });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Rate limit (60 req/min for write operations)
  const rateLimit = checkRateLimit(uid, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate article ID
  const { id: articleId } = await params;
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  // 4. Fetch article
  const db = adminDb();
  const articleRef = db.collection(COLLECTIONS.ARTICLES).doc(articleId);
  const articleDoc = await articleRef.get();

  if (!articleDoc.exists) {
    throw new NotFoundError('Article');
  }

  // 5. Verify ownership
  const article = articleDoc.data();
  assertValid(article?.ownerId === uid, 'You don\'t have permission to delete this article');

  // 6. Delete article
  await articleRef.delete();

  // 7. Return success
  return NextResponse.json({ success: true });
});