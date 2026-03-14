/**
 * Client-side authentication hook
 */

import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import type { User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Get ID token for API requests
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, idToken };
}

/**
 * Get auth headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    return {};
  }

  const token = await user.getIdToken();
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
