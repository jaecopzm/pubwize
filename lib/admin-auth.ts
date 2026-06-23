import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

function isAdminValue(val: unknown): boolean {
  return val === true || val === "true";
}

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string } | null> {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;

    // Check for admin claim in Clerk session metadata
    const isAdmin = isAdminValue((sessionClaims?.metadata as any)?.admin) ||
                    isAdminValue((sessionClaims?.publicMetadata as any)?.admin);
    if (!isAdmin) return null;

    return { uid: userId };
  } catch {
    return null;
  }
}
