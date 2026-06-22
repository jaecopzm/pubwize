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

export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'read'
): Promise<RateLimitResult> {
  try {
    const identifier = await getIdentifier(request);

    const limiter = rateLimiters[type];
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

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
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

/**
 * Simple identifier-based rate limit check (drop-in replacement for the old in-memory one).
 * Uses Upstash Redis with a sliding window per identifier.
 */
export async function checkRateLimitByIdentifier(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const { redis } = await import('./redis');
    if (!redis) {
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs };
    }

    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const key = `rl:${identifier}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs };
  }
}

async function getIdentifier(request: NextRequest): Promise<string> {
  try {
    const { userId } = await auth();
    if (userId) {
      return `user:${userId}`;
    }
  } catch {
    // fall through
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      return `user:${token.substring(0, 20)}`;
    }
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : (request as any).ip || 'unknown';
  return `ip:${ip}`;
}

export function withRateLimit<T extends NextResponse | Response = NextResponse>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  type: RateLimitType = 'read'
) {
  return async (request: NextRequest, ...args: any[]): Promise<T | NextResponse> => {
    const rateLimitResult = await checkRateLimit(request, type);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const response = await handler(request, ...args);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return response;
  };
}
