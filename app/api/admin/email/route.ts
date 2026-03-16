import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { resend, EMAIL_CONFIG } from "@/lib/email/resend-client";

type Segment = "all" | "paid" | "free" | "custom";

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html, segment, customEmails } = await req.json() as {
    subject: string;
    html: string;
    segment: Segment;
    customEmails?: string[];
  };

  if (!subject?.trim() || !html?.trim())
    return NextResponse.json({ error: "subject and html required" }, { status: 400 });

  let recipients: string[] = [];

  if (segment === "custom") {
    recipients = (customEmails ?? []).filter(Boolean);
  } else {
    const db = adminDb();
    let query: FirebaseFirestore.Query = db.collection("users").select("email", "planTier", "emailPreferences");

    if (segment === "paid") query = query.where("planStatus", "==", "active");

    const snap = await query.get();
    for (const doc of snap.docs) {
      const d = doc.data();
      if (!d.email) continue;
      if (segment === "free" && d.planTier !== "free" && d.planTier !== "none") continue;
      // Respect unsubscribe
      if (d.emailPreferences?.marketing === false) continue;
      recipients.push(d.email);
    }
  }

  if (recipients.length === 0)
    return NextResponse.json({ error: "No recipients" }, { status: 400 });

  // Resend supports up to 100 per batch call
  const BATCH = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    try {
      await resend.batch.send(
        chunk.map((to) => ({
          from: EMAIL_CONFIG.from,
          to,
          subject,
          html,
          replyTo: EMAIL_CONFIG.replyTo,
          tags: [{ name: "type", value: "admin_broadcast" }],
        }))
      );
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return NextResponse.json({ sent, failed, total: recipients.length });
}
