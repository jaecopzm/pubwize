import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPaddleClient } from '@/lib/paddle';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { subscriptionId } = await req.json();
    if (!subscriptionId) return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });

    const db = adminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.paddleSubscriptionId !== subscriptionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paddle = getPaddleClient();
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: 'next_billing_period' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}
