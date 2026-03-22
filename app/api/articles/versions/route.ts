import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withRateLimit } from '@/lib/rate-limit';

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: uid } = await auth();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, content, status } = await req.json();

    if (!articleId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = adminDb();
    
    // Verify article ownership
    const articleRef = db.collection('articles').doc(articleId);
    const articleDoc = await articleRef.get();

    if (!articleDoc.exists || articleDoc.data()?.ownerId !== uid) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Create version snapshot
    const versionRef = await db.collection('articleVersions').add({
      articleId,
      ownerId: uid,
      content,
      status: status || articleDoc.data()?.status,
      createdAt: new Date(),
    });

    return NextResponse.json({ versionId: versionRef.id });
  } catch (error) {
    console.error('Version save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, 'write');

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: uid } = await auth();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    const db = adminDb();

    // Get versions
    const versionsSnapshot = await db
      .collection('articleVersions')
      .where('articleId', '==', articleId)
      .where('ownerId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const versions = versionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Version fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, 'read');
