import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { restoreSnapshot } from '@/lib/services/version-history';

/**
 * POST /api/articles/[id]/versions/[versionId]/restore
 * Restore an article to a previous version snapshot
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id: articleId, versionId } = await params;
    const db = adminDb();

    // Verify article ownership
    const articleDoc = await db.collection('articles').doc(articleId).get();
    if (!articleDoc.exists) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const article = articleDoc.data();
    if (article?.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this article' },
        { status: 403 }
      );
    }

    // Restore the snapshot
    await restoreSnapshot(db as any, articleId, versionId, userId);

    return NextResponse.json({
      success: true,
      message: 'Article restored to previous version',
    });
  } catch (error) {
    console.error('Error restoring version snapshot:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to restore version snapshot' },
      { status: 500 }
    );
  }
}
