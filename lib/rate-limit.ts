/**
 * Rate Limiting Utilities
 * Wrapper around Upstash rate limiters with error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimiters } from './redis';

export type RateLimitType = keyof typeof rateLimiters;

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  response?: NextResponse;
}

/**
 * Check rate limit for a request
 * Returns result with remaining quota and reset time
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'read'
): Promise<RateLimitResult> {
  try {
    // Get identifier (user ID from auth or IP address)
    const identifier = await getIdentifier(request);
    
    // Check rate limit
    const limiter = rateLimiters[type];
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    // If rate limited, return 429 response
    if (!success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
          limit,
          remaining: 0,
          reset,
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', reset.toString());
      response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString());

      return {
        success: false,
        limit,
        remaining: 0,
        reset,
        response,
      };
    }

    return {
      success: true,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

/**
 * Get identifier for rate limiting
 * Prefers user ID from auth, falls back to IP address
 */
async function getIdentifier(request: NextRequest): Promise<string> {
  // Try to get user ID from Clerk
  try {
    const { userId } = await auth();
    if (userId) {
      return `user:${userId}`;
    }
  } catch (err) {
    // Graceful fallback
  }

  // Try to get user ID from Authorization header directly (fallback for generic clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      return `user:${token.substring(0, 20)}`; 
    }
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : (request as any).ip || 'unknown';
  return `ip:${ip}`;
}

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit<T extends NextResponse | Response = NextResponse>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  type: RateLimitType = 'read'
) {
  return async (request: NextRequest, ...args: any[]): Promise<T | NextResponse> => {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, type);

    // If rate limited, return 429 response
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return response;
  };
}
