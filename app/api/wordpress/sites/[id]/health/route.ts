import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getWordPressSitesCollectionPath } from "@/lib/firestore/collections";
import { checkConnectionHealth } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";
import type { WordPressSite } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: siteId } = await params;

    // Get site
    const sitesPath = getWordPressSitesCollectionPath(user.uid);
    const siteDoc = await adminDb().collection(sitesPath).doc(siteId).get();

    if (!siteDoc.exists) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = { id: siteDoc.id, ...siteDoc.data() } as WordPressSite;

    // Check health
    const health = await checkConnectionHealth(site);

    // Update last validated timestamp if healthy
    if (health.healthy) {
      await siteDoc.ref.update({
        lastValidated: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
        },
        connected: true,
      });
    } else {
      await siteDoc.ref.update({
        connected: false,
      });
    }

    return NextResponse.json(health);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error checking site health:", error);
    return NextResponse.json(
      { error: "Failed to check site health" },
      { status: 500 }
    );
  }
}
