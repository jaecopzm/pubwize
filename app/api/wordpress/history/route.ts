import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

// GET - Get publish history for user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = adminDb()
      .collection('wordpress_publish_history')
      .where('userId', '==', user.uid)
      .orderBy('publishedAt', 'desc')
      .limit(limit);

    if (articleId) {
      query = query.where('articleId', '==', articleId) as any;
    }

    const snapshot = await query.get();

    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ history });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error fetching publish history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

// POST - Log publish attempt
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { articleId, siteId, postId, postUrl, status, error, retryCount } = body;

    if (!articleId || !siteId) {
      return NextResponse.json(
        { error: "articleId and siteId are required" },
        { status: 400 }
      );
    }

    const historyData = {
      userId: user.uid,
      articleId,
      siteId,
      postId: postId || null,
      postUrl: postUrl || null,
      status: status || 'pending',
      error: error || null,
      retryCount: retryCount || 0,
      publishedAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };

    const docRef = await adminDb()
      .collection('wordpress_publish_history')
      .add(historyData);

    return NextResponse.json({
      success: true,
      historyId: docRef.id,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error logging publish history:", error);
    return NextResponse.json(
      { error: "Failed to log history" },
      { status: 500 }
    );
  }
}
