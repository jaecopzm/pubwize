/**
 * Authentication utilities for API routes
 */

import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export interface AuthUser {
  uid: string;
  email: string | null;
}

/**
 * Get authenticated user from request
 * Expects Authorization header with Firebase ID token
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
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
