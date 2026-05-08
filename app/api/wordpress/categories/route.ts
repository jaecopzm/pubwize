import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
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

    const response = await fetch(`${wpSite.siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers: { Authorization: `Basic ${Buffer.from(`${wpSite.username}:${cleanPassword}`).toString("base64")}` },
    });

    if (!response.ok) throw new Error("Failed to fetch categories");
    const categories = await response.json();

    return NextResponse.json({ categories: categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
