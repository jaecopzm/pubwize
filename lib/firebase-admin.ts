import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("Missing FIREBASE_PROJECT_ID for Firebase Admin");
  }

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  return app;
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());

