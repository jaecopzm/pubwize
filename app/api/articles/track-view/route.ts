import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
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

    const { articleId } = await req.json();

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    const db = adminDb();
    const articleRef = db.collection('articles').doc(articleId);
    const articleDoc = await articleRef.get();

    if (!articleDoc.exists) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const articleData = articleDoc.data();
    
    // Only track views for own articles
    if (articleData?.ownerId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Increment view count
    await articleRef.update({
      views: (articleData?.views || 0) + 1,
      lastViewedAt: new Date(),
    });

    return NextResponse.json({ success: true, views: (articleData?.views || 0) + 1 });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
