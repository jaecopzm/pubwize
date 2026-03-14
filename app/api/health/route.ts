import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Health Check Endpoint
 * Verifies all critical services are operational
 */

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: 'unknown',
      firestore: 'unknown',
      gemini: 'unknown',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    // Check Redis connectivity
    try {
      await redis.ping();
      checks.services.redis = 'healthy';
    } catch (error) {
      checks.services.redis = 'unhealthy';
      checks.status = 'degraded';
      console.error('Redis health check failed:', error);
    }

    // Check Firestore connectivity
    try {
      const db = adminDb();
      // Try to read a document (lightweight operation)
      await db.collection('_health').doc('check').get();
      checks.services.firestore = 'healthy';
    } catch (error) {
      checks.services.firestore = 'unhealthy';
      checks.status = 'degraded';
      console.error('Firestore health check failed:', error);
    }

    // Check Gemini API availability (just check if key is configured)
    if (process.env.GEMINI_API_KEY) {
      checks.services.gemini = 'configured';
    } else {
      checks.services.gemini = 'not_configured';
      checks.status = 'degraded';
    }

    // Determine overall status
    const unhealthyServices = Object.values(checks.services).filter(
      (status) => status === 'unhealthy'
    );

    if (unhealthyServices.length > 0) {
      checks.status = 'unhealthy';
      return NextResponse.json(checks, { status: 503 });
    }

    if (checks.status === 'degraded') {
      return NextResponse.json(checks, { status: 200 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
