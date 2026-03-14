/**
 * Email Unsubscribe API
 * Handles email unsubscribe requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type') || 'all';

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user by email
    const usersSnapshot = await adminDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update email preferences
    const emailPreferences = {
      marketing: type === 'all' || type === 'marketing' ? false : true,
      productUpdates: type === 'all' || type === 'product' ? false : true,
      weeklyDigest: type === 'all' || type === 'digest' ? false : true,
      // Always keep transactional emails enabled
      transactional: true,
    };

    await adminDb().collection('users').doc(userId).update({
      emailPreferences,
      unsubscribedAt: new Date().toISOString(),
    });

    logger.info('User unsubscribed from emails', { email, type });

    // Return HTML page
    return new NextResponse(
      `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - Pubwize</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      margin: 0;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      margin: 0 0 16px 0;
      font-size: 28px;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    a {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #008080 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 16px;
    }
    a:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>You're Unsubscribed</h1>
    <p>You've been successfully unsubscribed from ${type === 'all' ? 'all marketing' : type} emails.</p>
    <p style="font-size: 14px;">You'll still receive important account and transactional emails.</p>
    <a href="https://pubwize.com/dashboard/settings">Manage Email Preferences</a>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    logger.error('Unsubscribe error', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
