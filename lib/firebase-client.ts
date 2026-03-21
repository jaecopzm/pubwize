import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  type Firestore,
} from "firebase/firestore";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

declare global {
  interface Window {
    Clerk: any;
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const existing = getApps();
  app = existing.length ? existing[0] : initializeApp(config);
  return app;
}

// Map Clerk to the existing Firebase Auth interface so components don't break
export function getFirebaseAuth(): any {
  if (typeof window !== "undefined" && window.Clerk) {
    const user = window.Clerk.user;
    
    const mappedUser = user ? {
      uid: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      displayName: user.fullName || "",
      photoURL: user.imageUrl || "",
      getIdToken: async () => await window.Clerk.session?.getToken(),
    } : null;

    return {
      currentUser: mappedUser,
      signOut: async () => await window.Clerk.signOut(),
      onAuthStateChanged: (callback: any) => {
        // Fire initially
        callback(mappedUser);
        
        // Listen for changes
        window.Clerk.addListener(({ user: newUser }: any) => {
          callback(newUser ? {
            uid: newUser.id,
            email: newUser.primaryEmailAddress?.emailAddress,
            displayName: newUser.fullName || "",
            photoURL: newUser.imageUrl || "",
            getIdToken: async () => await window.Clerk.session?.getToken(),
          } : null);
        });
        
        return () => {}; // return dummy unsubscribe
      }
    };
  }
  
  return { 
    currentUser: null,
    signOut: async () => {},
    onAuthStateChanged: (cb: any) => { cb(null); return () => {}; }
  };
}

export function getFirestoreDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}

