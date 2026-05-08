import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSnapshot, getSnapshots } from "@/lib/services/version-history";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: articleId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const snapshots = await getSnapshots(null, articleId, { limit, includeArchived });
    return NextResponse.json({ snapshots, count: snapshots.length });
  } catch (error) {
    console.error("Error fetching version snapshots:", error);
    return NextResponse.json({ error: "Failed to fetch version snapshots" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: articleId } = await params;
    const { changeDescription } = await request.json();

    if (!changeDescription || typeof changeDescription !== "string") {
      return NextResponse.json({ error: "changeDescription is required" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const snapshotId = await createSnapshot(null, articleId, userId, changeDescription);
    return NextResponse.json({ success: true, snapshotId });
  } catch (error) {
    console.error("Error creating version snapshot:", error);
    return NextResponse.json({ error: "Failed to create version snapshot" }, { status: 500 });
  }
}
