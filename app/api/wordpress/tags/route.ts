import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) return NextResponse.json({ error: "siteId is required" }, { status: 400 });

    const wpSite = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
    if (!wpSite || wpSite.userId !== userId) {
      return NextResponse.json({ error: "WordPress site not found" }, { status: 404 });
    }

    const { decryptPassword } = await import("@/lib/wordpress/encryption");
    const cleanPassword = decryptPassword(wpSite.encryptedPassword).replace(/\s+/g, "");

    const response = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/tags?per_page=100`, {
      headers: { Authorization: `Basic ${Buffer.from(`${wpSite.username}:${cleanPassword}`).toString("base64")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch tags");
    const tags = await response.json();

    return NextResponse.json({ tags: tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) });
  } catch (error) {
    logger.error("Error fetching tags", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
