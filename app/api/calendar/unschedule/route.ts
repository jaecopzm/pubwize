import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/firestore/collections';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
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
      scheduledDate: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unscheduling article:', error);
    return NextResponse.json({ error: 'Failed to unschedule article' }, { status: 500 });
  }
}
