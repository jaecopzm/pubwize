import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const cursor = searchParams.get("cursor");

  let query = db
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (cursor) {
    const cursorDoc = await db.collection("users").doc(cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();

  const users = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      email: d.email,
      displayName: d.displayName ?? null,
      planTier: d.planTier ?? "none",
      planStatus: d.planStatus ?? null,
      articleCountThisPeriod: d.articleCountThisPeriod ?? 0,
      createdAt: d.createdAt,
    };
  });

  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;

  return NextResponse.json({ users, nextCursor });
}
