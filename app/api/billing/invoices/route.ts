import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getPaddleClient } from '@/lib/paddle';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await adminAuth().verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

    const paddle = getPaddleClient();
    const collection = paddle.transactions.list({ customerId: [customerId] });
    const items = await collection.next();

    return NextResponse.json({ invoices: items || [] });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
