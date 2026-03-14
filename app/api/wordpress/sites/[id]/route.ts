import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getWordPressSitePath } from "@/lib/firestore/collections";
import { requireAuth } from "@/lib/auth";

// DELETE - Disconnect a WordPress site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const userId = user.uid;

    const { id: siteId } = await params;
    const sitePath = getWordPressSitePath(userId, siteId);

    // Delete the site
    await adminDb().doc(sitePath).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting WordPress site:", error);
    return NextResponse.json(
      { error: "Failed to disconnect site" },
      { status: 500 }
    );
  }
}
