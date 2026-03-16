import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string } | null> {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return null;

    const decoded = await adminAuth().verifyIdToken(token);
    if (!decoded.admin) return null;

    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
