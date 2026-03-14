import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy for route protection and security
 * Runs on Edge Runtime for maximum performance
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all routes
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Protected dashboard routes - check for auth
  if (pathname.startsWith('/dashboard')) {
    // Note: Firebase auth verification happens client-side and in API routes
    // This proxy just adds security headers and can be extended
    // for additional edge-level checks
    
    return response;
  }

  return response;
}

// Configure which routes use this proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
