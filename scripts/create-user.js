#!/usr/bin/env node

/**
 * Manually create a user in Firestore for testing
 * Run this after signing up in Clerk
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function createUser() {
  const userId = process.argv[2];
  const email = process.argv[3];

  if (!userId || !email) {
    console.error('Usage: node scripts/create-user.js <clerk-user-id> <email>');
    console.error('Example: node scripts/create-user.js user_2abc123 test@example.com');
    process.exit(1);
  }

  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.collection('users').doc(userId).set({
    email,
    displayName: null,
    photoURL: null,
    planTier: 'free',
    status: 'active',
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
  });

  console.log(`✅ User created: ${userId} (${email})`);
  process.exit(0);
}

createUser().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
