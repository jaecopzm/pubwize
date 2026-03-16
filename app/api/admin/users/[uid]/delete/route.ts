import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

async function deleteUser(uid: string) {
  const db = adminDb();
  const auth = adminAuth();

  // Delete Firestore data
  const [articles, sites] = await Promise.all([
    db.collection("articles").where("ownerId", "==", uid).get(),
    db.collection("sites").where("ownerId", "==", uid).get(),
  ]);

  const batch = db.batch();
  batch.delete(db.collection("users").doc(uid));
  articles.docs.forEach((d) => batch.delete(d.ref));
  sites.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  // Delete Firebase Auth user
  await auth.deleteUser(uid).catch(() => {});
}

// DELETE /api/admin/users/[uid]  — single delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  await deleteUser(uid);
  return NextResponse.json({ ok: true });
}
