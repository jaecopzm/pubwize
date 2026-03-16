/**
 * Grant admin custom claim to a Firebase user.
 * Usage: npx ts-node -e "require('./scripts/set-admin-claim').setAdmin('user@example.com')"
 * Or:    EMAIL=user@example.com npx ts-node scripts/set-admin-claim.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export async function setAdmin(email: string) {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ Admin claim set for ${email} (uid: ${user.uid})`);
}

const email = process.argv[2] ?? process.env.EMAIL;
if (email) {
  setAdmin(email).catch(console.error);
} else {
  console.error("Usage: npx ts-node scripts/set-admin-claim.ts <email>");
  process.exit(1);
}
