/**
 * API Security & Rate Limiting Utilities
 * Provides centralized security checks and rate limiting for API routes
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface AuthResult {
  success: boolean;
  uid?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate user using Clerk
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Missing or invalid authorization",
        statusCode: 401,
      };
    }

    return {
      success: true,
      uid: userId,
    };
  } catch (error: any) {
    console.error("Clerk Authentication error:", error);
    
    return {
      success: false,
      error: "Authentication failed",
      statusCode: 401,
    };
  }
}

/**
 * Rate limiting check
 * @param identifier - User ID or IP address
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // No record or expired window
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  // Within window
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Validate request body fields
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { valid: boolean; error?: string; data?: T } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      return { valid: false, error: `Missing required field: ${String(field)}` };
    }
  }

  // Extract only allowed fields
  const allowedFields = [...requiredFields, ...optionalFields];
  const data: any = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  return { valid: true, data: data as T };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove potential HTML tags
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generate safe error response
 * Prevents leaking sensitive information
 */
export function safeErrorResponse(error: any, defaultMessage: string = "An error occurred") {
  // In production, don't expose internal errors
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (isDevelopment && error instanceof Error) {
    return {
      error: error.message,
      stack: error.stack,
    };
  }

  return {
    error: defaultMessage,
  };
}

/**
 * Log security event (for monitoring)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>
): void {
  console.warn(`[SECURITY] ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
