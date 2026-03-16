import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

// POST /api/admin/users/batch-delete  body: { uids: string[] }
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uids } = await req.json() as { uids: string[] };
  if (!Array.isArray(uids) || uids.length === 0)
    return NextResponse.json({ error: "uids required" }, { status: 400 });
  if (uids.length > 50)
    return NextResponse.json({ error: "Max 50 at a time" }, { status: 400 });

  const db = adminDb();
  const auth = adminAuth();

  const results: { uid: string; ok: boolean; error?: string }[] = [];

  for (const uid of uids) {
    try {
      const [articles, sites] = await Promise.all([
        db.collection("articles").where("ownerId", "==", uid).get(),
        db.collection("sites").where("ownerId", "==", uid).get(),
      ]);

      const batch = db.batch();
      batch.delete(db.collection("users").doc(uid));
      articles.docs.forEach((d) => batch.delete(d.ref));
      sites.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      await auth.deleteUser(uid).catch(() => {});
      results.push({ uid, ok: true });
    } catch (e: any) {
      results.push({ uid, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ results });
}
