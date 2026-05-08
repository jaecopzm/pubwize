import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: siteId } = await params;

    const site = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
    if (!site || site.userId !== user.uid) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    await prisma.wordPressSite.delete({ where: { id: siteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error disconnecting WordPress site:", error);
    return NextResponse.json({ error: "Failed to disconnect site" }, { status: 500 });
  }
}
