import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaddleClient } from "@/lib/paddle";

export async function POST(req: NextRequest) {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subscriptionId } = await req.json();
    if (!subscriptionId) return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user?.paddleSubscriptionId !== subscriptionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paddle = getPaddleClient();
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: "next_billing_period" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: error?.message || "Failed to cancel subscription" }, { status: 500 });
  }
}
