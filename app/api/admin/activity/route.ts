import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();

  const [recentUsers, recentArticles] = await Promise.all([
    db.collection("users").orderBy("createdAt", "desc").limit(20).get(),
    db.collection("articles").orderBy("createdAt", "desc").limit(20).get(),
  ]);

  const events = [
    ...recentUsers.docs.map((d) => ({
      type: "signup" as const,
      id: d.id,
      label: d.data().email ?? d.id,
      ts: d.data().createdAt || null,
    })),
    ...recentArticles.docs.map((d) => ({
      type: "article" as const,
      id: d.id,
      label: d.data().title || d.data().keyword || "Untitled",
      userId: d.data().ownerId,
      ts: d.data().createdAt || null,
    })),
  ]
    .filter((e) => e.ts && e.ts.seconds)
    .sort((a, b) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0))
    .slice(0, 40);

  return NextResponse.json({ events });
}
