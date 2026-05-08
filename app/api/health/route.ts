import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: { redis: "unknown", database: "unknown", gemini: "unknown" },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    try {
      await redis.ping();
      checks.services.redis = "healthy";
    } catch {
      checks.services.redis = "unhealthy";
      checks.status = "degraded";
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.services.database = "healthy";
    } catch {
      checks.services.database = "unhealthy";
      checks.status = "degraded";
    }

    checks.services.gemini = process.env.GEMINI_API_KEY ? "configured" : "not_configured";

    const unhealthy = Object.values(checks.services).filter((s) => s === "unhealthy");
    if (unhealthy.length > 0) {
      checks.status = "unhealthy";
      return NextResponse.json(checks, { status: 503 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: "unhealthy", error: "Health check failed", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
