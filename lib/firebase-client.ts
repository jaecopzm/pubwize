/**
 * Firebase client stub - auth is handled by Clerk via cookies.
 * API routes use Clerk's auth() server-side; no Bearer token needed.
 * This stub keeps existing call sites working without changes.
 */

export function getFirebaseAuth() {
  const clerkUser = typeof window !== "undefined" ? (window as any).Clerk?.user : null;

  return {
    currentUser: {
      uid: clerkUser?.id || "",
      email: clerkUser?.primaryEmailAddress?.emailAddress || "",
      displayName: clerkUser?.fullName || "",
      photoURL: clerkUser?.imageUrl || "",
      getIdToken: async () => "clerk-session",
    },
    signOut: async () => {},
    onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
  };
}

export function getFirebaseApp() { return {}; }
export function getFirestoreDb() { return {}; }
