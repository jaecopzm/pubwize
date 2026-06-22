import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export interface AuthResult {
  success: boolean;
  uid?: string;
  error?: string;
  statusCode?: number;
}

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

export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { valid: boolean; error?: string; data?: T } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      return { valid: false, error: `Missing required field: ${String(field)}` };
    }
  }

  const allowedFields = [...requiredFields, ...optionalFields];
  const data: any = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  return { valid: true, data: data as T };
}

export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength).replace(/[<>]/g, "");
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function safeErrorResponse(error: any, defaultMessage: string = "An error occurred") {
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

export function logSecurityEvent(
  event: string,
  details: Record<string, any>
): void {
  console.warn("[SECURITY]", {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
