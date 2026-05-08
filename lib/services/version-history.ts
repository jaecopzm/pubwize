/**
 * Version History Service - Prisma
 */

import { prisma } from "@/lib/prisma";
import type { VersionSnapshot } from "@/lib/types";

export async function createSnapshot(
  _db: unknown,
  articleId: string,
  userId: string,
  changeDescription: string
): Promise<string> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.ownerId !== userId) throw new Error("Unauthorized");

  let contentType: "brief" | "outline" | "draft" = "draft";
  if (article.draft) contentType = "draft";
  else if (article.outline) contentType = "outline";
  else if (article.brief) contentType = "brief";

  const snapshot = await prisma.versionSnapshot.create({
    data: {
      articleId,
      userId,
      changeDescription,
      contentType,
      snapshot: {
        brief: article.brief || undefined,
        outline: article.outline || undefined,
        draft: article.draft || undefined,
        settings: article.settings || undefined,
      },
    },
  });

  return snapshot.id;
}

export async function getSnapshots(
  _db: unknown,
  articleId: string,
  options?: { limit?: number; includeArchived?: boolean }
): Promise<VersionSnapshot[]> {
  const snapshots = await prisma.versionSnapshot.findMany({
    where: {
      articleId,
      ...(options?.includeArchived ? {} : { archived: false }),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit,
  });

  return snapshots.map((s) => ({
    id: s.id,
    articleId: s.articleId,
    userId: s.userId,
    timestamp: { seconds: Math.floor(s.createdAt.getTime() / 1000), nanoseconds: 0 },
    changeDescription: s.changeDescription,
    contentType: s.contentType as "brief" | "outline" | "draft",
    snapshot: s.snapshot as any,
    archived: s.archived,
  }));
}

export async function getSnapshot(
  _db: unknown,
  articleId: string,
  snapshotId: string
): Promise<VersionSnapshot | null> {
  const s = await prisma.versionSnapshot.findUnique({ where: { id: snapshotId } });
  if (!s || s.articleId !== articleId) return null;

  return {
    id: s.id,
    articleId: s.articleId,
    userId: s.userId,
    timestamp: { seconds: Math.floor(s.createdAt.getTime() / 1000), nanoseconds: 0 },
    changeDescription: s.changeDescription,
    contentType: s.contentType as "brief" | "outline" | "draft",
    snapshot: s.snapshot as any,
    archived: s.archived,
  };
}

export async function restoreSnapshot(
  _db: unknown,
  articleId: string,
  snapshotId: string,
  userId: string
): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.ownerId !== userId) throw new Error("Unauthorized");

  const snapshot = await prisma.versionSnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || snapshot.articleId !== articleId) throw new Error("Snapshot not found");

  const snap = snapshot.snapshot as any;

  // Backup current state
  await createSnapshot(_db, articleId, userId, `Backup before restoring to snapshot ${snapshotId}`);

  await prisma.article.update({
    where: { id: articleId },
    data: {
      brief: snap.brief ?? null,
      outline: snap.outline ?? null,
      draft: snap.draft ?? null,
      settings: snap.settings ?? article.settings,
    },
  });
}
