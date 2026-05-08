import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { resend, EMAIL_CONFIG } from "@/lib/email/resend-client";

type Segment = "all" | "paid" | "free" | "custom";

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html, segment, customEmails } = (await req.json()) as {
    subject: string;
    html: string;
    segment: Segment;
    customEmails?: string[];
  };

  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "subject and html required" }, { status: 400 });
  }

  let recipients: string[] = [];

  if (segment === "custom") {
    recipients = (customEmails ?? []).filter(Boolean);
  } else {
    const users = await prisma.user.findMany({
      where: {
        ...(segment === "paid" ? { planStatus: "active" } : {}),
      },
      select: { email: true, planTier: true, emailPreferences: true },
    });

    for (const u of users) {
      if (!u.email) continue;
      if (segment === "free" && u.planTier !== "free" && u.planTier !== "none") continue;
      const prefs = u.emailPreferences as any;
      if (prefs?.marketing === false) continue;
      recipients.push(u.email);
    }
  }

  if (recipients.length === 0) return NextResponse.json({ error: "No recipients" }, { status: 400 });

  const BATCH = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    try {
      await resend.batch.send(
        chunk.map((to) => ({ from: EMAIL_CONFIG.from, to, subject, html, replyTo: EMAIL_CONFIG.replyTo, tags: [{ name: "type", value: "admin_broadcast" }] }))
      );
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return NextResponse.json({ sent, failed, total: recipients.length });
}
