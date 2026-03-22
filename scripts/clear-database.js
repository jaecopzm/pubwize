#!/usr/bin/env node

/**
 * Clear Firestore database for fresh Clerk migration
 * WARNING: This will delete ALL data!
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
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

async function clearCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`✓ ${collectionName}: already empty`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✓ ${collectionName}: deleted ${snapshot.size} documents`);
}

async function clearDatabase() {
  console.log('🗑️  Clearing Firestore database...\n');

  const collections = [
    'users',
    'articles',
    'sites',
    'aiUsageLogs',
    'activityLogs',
  ];

  for (const collection of collections) {
    await clearCollection(collection);
  }

  console.log('\n✅ Database cleared successfully!');
  console.log('\nNext steps:');
  console.log('1. Sign up with a new account in Clerk');
  console.log('2. Clerk webhook will create the user in Firestore');
  console.log('3. Start fresh with clean data');
  
  process.exit(0);
}

clearDatabase().catch((error) => {
  console.error('❌ Error clearing database:', error);
  process.exit(1);
});
