import { NextResponse } from "next/server";

export function apiSuccess<T extends Record<string, unknown> = Record<string, never>>(
  data?: T & { success?: never },
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true as const, ...data }, { status });
}

export function apiError(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error: message, ...details }, { status });
}
