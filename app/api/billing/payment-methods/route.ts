import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import DodoPayments from 'dodopayments';
import { getDodoEnv } from '@/lib/dodo';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminAuth().verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
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

    // Get customer details which includes payment method info
    const customer = await client.customers.retrieve(customerId);

    return NextResponse.json({ 
      paymentMethods: (customer as any).default_payment_method ? [(customer as any).default_payment_method] : [] 
    });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
