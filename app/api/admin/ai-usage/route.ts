import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid"); // optional filter by user

  let query = db.collection("aiUsageLogs").orderBy("ts", "desc").limit(100) as FirebaseFirestore.Query;
  if (uid) query = query.where("userId", "==", uid);

  const snap = await query.get();

  // Aggregate by provider + taskType
  const byProvider: Record<string, number> = {};
  const byTask: Record<string, number> = {};
  const logs = snap.docs.map((d) => {
    const data = d.data();
    byProvider[data.provider] = (byProvider[data.provider] ?? 0) + 1;
    byTask[data.taskType] = (byTask[data.taskType] ?? 0) + 1;
    return { id: d.id, ...data, ts: data.ts?.toDate?.()?.toISOString() ?? null };
  });

  return NextResponse.json({ logs, byProvider, byTask, total: snap.size });
}
