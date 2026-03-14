/**
 * Centralized Error Handling
 * Provides consistent error handling across the application
 */

import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class QuotaExceededError extends AppError {
  constructor(
    message: string,
    public current: number,
    public limit: number,
    public quotaType: string
  ) {
    super(message, 403, "QUOTA_EXCEEDED", { current, limit, quotaType });
    this.name = "QuotaExceededError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    public resetTime: number,
    message: string = "Too many requests. Please try again later."
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { resetTime });
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(
      `External service error: ${service}`,
      503,
      "EXTERNAL_SERVICE_ERROR",
      { service, originalError: originalError?.message }
    );
    this.name = "ExternalServiceError";
  }
}

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleApiError(error: any): NextResponse {
  console.error("API Error:", error);

  // Handle known error types
  if (error instanceof QuotaExceededError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        current: error.current,
        limit: error.limit,
        quotaType: error.quotaType,
        upgradeRequired: true,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        resetTime: error.resetTime,
      },
      {
        status: error.statusCode,
        headers: {
          "Retry-After": String(Math.ceil((error.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Firebase errors
  if (error.code?.startsWith("auth/")) {
    return NextResponse.json(
      {
        error: "Authentication failed",
        code: "AUTHENTICATION_ERROR",
      },
      { status: 401 }
    );
  }

  // Handle unknown errors (don't expose internal details in production)
  const isDevelopment = process.env.NODE_ENV === "development";

  return NextResponse.json(
    {
      error: isDevelopment ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
      ...(isDevelopment && error.stack && { stack: error.stack }),
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandler(
  handler: (req: any, context?: any) => Promise<NextResponse>
): (req: any, context?: any) => Promise<NextResponse>;
export function withErrorHandler(
  handler: (req: any, context?: any) => Promise<Response>
): (req: any, context?: any) => Promise<Response>;
export function withErrorHandler(
  handler: (req: any, context?: any) => Promise<NextResponse | Response>
) {
  return async (req: any, context?: any): Promise<NextResponse | Response> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Validate and throw if invalid
 */
export function assertValid(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(uid: string | undefined): asserts uid is string {
  if (!uid) {
    throw new AuthenticationError();
  }
}

/**
 * Assert user has permission
 */
export function assertAuthorized(
  condition: boolean,
  message: string = "Insufficient permissions"
): asserts condition {
  if (!condition) {
    throw new AuthorizationError(message);
  }
}

/**
 * Retry logic for external services
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
