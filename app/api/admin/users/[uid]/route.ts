import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  const db = adminDb();

  const [userSnap, articlesSnap, sitesSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("articles").where("ownerId", "==", uid).orderBy("createdAt", "desc").limit(20).get(),
    db.collection("sites").where("ownerId", "==", uid).get(),
  ]);

  if (!userSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user: { uid, ...userSnap.data() },
    articles: articlesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    sites: sitesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  const body = await req.json();

  const allowed = ["planTier", "planStatus"] as const;
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  await adminDb().collection("users").doc(uid).update(update);
  return NextResponse.json({ ok: true });
}
