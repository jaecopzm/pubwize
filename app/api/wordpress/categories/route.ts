import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore/collections';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    const db = adminDb();
    const wpSiteRef = db.collection('wordpress_sites').doc(siteId);
    const wpSiteDoc = await wpSiteRef.get();

    if (!wpSiteDoc.exists) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }

    const wpSite = wpSiteDoc.data();
    if (wpSite?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch categories from WordPress
    const response = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${wpSite.username}:${wpSite.applicationPassword}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categories = await response.json();

    return NextResponse.json({
      categories: categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
