/**
 * Client-side authentication hook
 */

import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useClerkAuth();

  const user = clerkUser ? {
    uid: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    displayName: clerkUser.fullName || "",
    photoURL: clerkUser.imageUrl || "",
    getIdToken: async () => await getToken(),
  } : null;

  return { 
    user, 
    loading: !isLoaded,
    idToken: null // Components usually call user.getIdToken() directly
  };
}

/**
 * Get auth headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  if (typeof window !== 'undefined' && window.Clerk && window.Clerk.session) {
    const token = await window.Clerk.session.getToken();
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {};
}
