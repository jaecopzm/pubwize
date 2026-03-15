import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import DodoPayments from 'dodopayments';
import { getDodoEnv } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const env = getDodoEnv();
    const mode = env === 'sandbox' ? 'test_mode' : 'live_mode';

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: mode,
    });

    // Cancel the subscription via update
    await client.subscriptions.update(subscriptionId, {
      status: 'cancelled'
    });

    // Update user in Firestore
    const db = adminDb();
    await db.collection('users').doc(uid).update({
      plan: 'free',
      planTier: 'free',
      dodoSubscriptionId: null,
      status: 'canceled',
      canceledAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
