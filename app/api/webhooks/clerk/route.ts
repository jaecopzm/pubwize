import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Server configuration error", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  if (!body) return new Response("Empty body", { status: 400 });

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Signature verification failed", { status: 400 });
  }

  if (evt.type === "user.created") {
    const user = evt.data;
    const email = user.email_addresses[0]?.email_address || "";

    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email,
        displayName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || null,
        photoURL: user.image_url || null,
        planTier: "free",
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
  }

  return new Response("", { status: 200 });
}

export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", hasSecret: !!process.env.CLERK_WEBHOOK_SECRET }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
