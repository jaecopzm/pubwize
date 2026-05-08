import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string } | null> {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;

    // Check for admin claim in Clerk session metadata
    const isAdmin = (sessionClaims?.metadata as any)?.admin === true ||
                    (sessionClaims?.publicMetadata as any)?.admin === true;
    if (!isAdmin) return null;

    return { uid: userId };
  } catch {
    return null;
  }
}
