import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Notify team of new subscriber — wire to your newsletter provider here
  try {
    const { resend, EMAIL_CONFIG } = await import("@/lib/email/resend-client");
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: "hello@pubwize.com",
      subject: "New newsletter subscriber",
      html: `<p>New subscriber: <strong>${email}</strong></p>`,
    });
  } catch {}

  return NextResponse.json({ success: true });
});
