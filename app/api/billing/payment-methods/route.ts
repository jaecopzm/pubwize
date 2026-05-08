import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPaddleClient } from "@/lib/paddle";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

    const paddle = getPaddleClient();
    const collection = paddle.paymentMethods.list(customerId);
    const items = await collection.next();

    return NextResponse.json({ paymentMethods: items || [] });
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch payment methods" }, { status: 500 });
  }
}
