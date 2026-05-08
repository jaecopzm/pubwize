import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const type = searchParams.get("type") || "all";

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const emailPreferences = {
      marketing: !(type === "all" || type === "marketing"),
      productUpdates: !(type === "all" || type === "product"),
      weeklyDigest: !(type === "all" || type === "digest"),
      transactional: true,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { emailPreferences, unsubscribedAt: new Date().toISOString() },
    });

    logger.info("User unsubscribed from emails", { email, type });

    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Unsubscribed - Pubwize</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5"><div style="background:white;border-radius:12px;padding:40px;max-width:500px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.1)"><div style="font-size:64px;margin-bottom:20px">✓</div><h1>You're Unsubscribed</h1><p>You've been successfully unsubscribed from ${type === "all" ? "all marketing" : type} emails.</p><p style="font-size:14px">You'll still receive important account and transactional emails.</p><a href="https://pubwize.com/dashboard/settings" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#008080);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:16px">Manage Email Preferences</a></div></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    logger.error("Unsubscribe error", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
