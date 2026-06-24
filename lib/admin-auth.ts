import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

function isAdminValue(val: unknown): boolean {
  return val === true || val === "true";
}

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string } | null> {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;

    // Check for admin claim in Clerk session metadata (JWT claims)
    const isAdmin = isAdminValue((sessionClaims?.metadata as any)?.admin) ||
                    isAdminValue((sessionClaims?.publicMetadata as any)?.admin);

    // Fall back to fetching from Clerk API if JWT template doesn't include publicMetadata
    if (!isAdmin) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const pubMeta = clerkUser.publicMetadata as Record<string, unknown>;
        if (!isAdminValue(pubMeta?.admin)) return null;
      } catch {
        return null;
      }
    }

    return { uid: userId };
  } catch {
    return null;
  }
}
