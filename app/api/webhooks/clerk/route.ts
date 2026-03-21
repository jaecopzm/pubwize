import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    return new Response('Server configuration error', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }

  if (evt.type === 'user.created') {
    const user = evt.data;
    const email = user.email_addresses[0]?.email_address || '';
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
    
    console.log(`[Clerk Webhook] User provisioned in Firestore: ${user.id}`);
  }

  return new Response('', { status: 200 });
}
