import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/firestore/collections';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { articleId, date } = await request.json();

    if (!articleId || !date) {
      return NextResponse.json({ error: 'articleId and date are required' }, { status: 400 });
    }

    const db = adminDb();
    const articleRef = db.collection(COLLECTIONS.ARTICLES).doc(articleId);
    const articleDoc = await articleRef.get();

    if (!articleDoc.exists) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = articleDoc.data();
    if (article?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await articleRef.update({
      scheduledDate: Timestamp.fromDate(new Date(date)),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling article:', error);
    return NextResponse.json({ error: 'Failed to schedule article' }, { status: 500 });
  }
}
