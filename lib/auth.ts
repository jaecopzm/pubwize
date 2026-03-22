/**
 * Authentication utilities for API routes
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export interface AuthUser {
  uid: string;
  email: string | null;
}

/**
 * Get authenticated user from request using Clerk
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // Get email from Clerk if needed (optional, can be fetched from Firestore)
    return {
      uid: userId,
      email: null, // Email is in Firestore user doc if needed
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Require authentication - returns user or throws 401 response
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return user;
}
