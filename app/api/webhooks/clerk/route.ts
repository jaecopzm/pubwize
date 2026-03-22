import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  console.log('🔔 [Clerk Webhook] Received webhook request');
  
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('❌ [Clerk Webhook] CLERK_WEBHOOK_SECRET not configured');
    return new Response('Server configuration error', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  console.log('📋 [Clerk Webhook] Headers:', { svix_id, svix_timestamp, has_signature: !!svix_signature });

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ [Clerk Webhook] Missing svix headers');
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  const body = await req.text();
  
  if (!body) {
    console.error('❌ [Clerk Webhook] Empty body received');
    return new Response('Empty body', { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    console.error('❌ [Clerk Webhook] Invalid JSON body:', e);
    return new Response('Invalid JSON', { status: 400 });
  }
  
  console.log('📦 [Clerk Webhook] Event type:', payload.type);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    console.log('✅ [Clerk Webhook] Signature verified');
  } catch (err) {
    console.error('❌ [Clerk Webhook] Signature verification failed:', err);
    return new Response('Error occured', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const user = evt.data;
    const email = user.email_addresses[0]?.email_address || '';
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    console.log(`👤 [Clerk Webhook] Creating user in Firestore: ${user.id} (${email})`);

    try {
      const userRef = adminDb().collection("users").doc(user.id);
      
      await userRef.set({
        email,
        displayName: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null,
        photoURL: user.image_url || null,
        planTier: "free",
        status: "active",
        createdAt: now,
        updatedAt: now,
        usage: {
          articlesUsed: 0,
          aiImprovementsUsed: 0,
          sectionRegenerationsUsed: 0,
          researchQueriesUsed: 0,
          rolloverArticles: 0,
          periodStart: now,
          periodEnd: inThirtyDays,
        },
      }, { merge: true });
      
      console.log(`✅ [Clerk Webhook] User created successfully: ${user.id}`);
    } catch (error) {
      console.error('❌ [Clerk Webhook] Failed to create user in Firestore:', error);
      return new Response('Failed to create user', { status: 500 });
    }
  } else {
    console.log(`ℹ️  [Clerk Webhook] Unhandled event type: ${evt.type}`);
  }

  return new Response('', { status: 200 });
}

// Test endpoint to verify webhook is accessible
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Clerk webhook endpoint is accessible',
    hasSecret: !!process.env.CLERK_WEBHOOK_SECRET,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
