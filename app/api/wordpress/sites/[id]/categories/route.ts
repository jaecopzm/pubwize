import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getWordPressSitePath } from "@/lib/firestore/collections";
import { getCategories } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";
import type { WordPressSite } from "@/lib/types";

// GET - Get categories from a WordPress site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const userId = user.uid;

    const { id: siteId } = await params;
    const sitePath = getWordPressSitePath(userId, siteId);

    // Get site from Firestore
    const siteDoc = await adminDb().doc(sitePath).get();
    
    if (!siteDoc.exists) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    const site = { id: siteDoc.id, ...siteDoc.data() } as WordPressSite;

    // Fetch categories from WordPress
    const categories = await getCategories(site);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
