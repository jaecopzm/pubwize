import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createSnapshot, getSnapshots } from '@/lib/services/version-history';

/**
 * GET /api/articles/[id]/versions
 * List all version snapshots for an article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: articleId } = await params;
    const db = adminDb();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

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

    // Fetch snapshots
    const snapshots = await getSnapshots(db as any, articleId, {
      limit,
      includeArchived,
    });

    return NextResponse.json({
      snapshots,
      count: snapshots.length,
    });
  } catch (error) {
    console.error('Error fetching version snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version snapshots' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[id]/versions
 * Create a new version snapshot
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: articleId } = await params;
    const db = adminDb();

    // Parse request body
    const body = await request.json();
    const { changeDescription } = body;

    if (!changeDescription || typeof changeDescription !== 'string') {
      return NextResponse.json(
        { error: 'changeDescription is required and must be a string' },
        { status: 400 }
      );
    }

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

    // Create snapshot
    const snapshotId = await createSnapshot(
      db as any,
      articleId,
      userId,
      changeDescription
    );

    return NextResponse.json({
      success: true,
      snapshotId,
    });
  } catch (error) {
    console.error('Error creating version snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create version snapshot' },
      { status: 500 }
    );
  }
}
