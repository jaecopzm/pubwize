import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { resetMonthlyUsage } from '@/lib/usage-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();
    const usersSnapshot = await db.collection('users').get();

    let resetCount = 0;
    const errors: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
      try {
        await resetMonthlyUsage(db, userDoc.id);
        resetCount++;
      } catch (error) {
        console.error(`Failed to reset usage for user ${userDoc.id}:`, error);
        errors.push(userDoc.id);
      }
    }

    console.log(`[Cron] Reset usage for ${resetCount} users. Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      resetCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error('[Cron] Usage reset failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
