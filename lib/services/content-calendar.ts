/**
 * Content Calendar Service - Prisma
 */

import { prisma } from "@/lib/prisma";
import type { CalendarEvent, ArticleStatus } from "@/lib/types";

export async function getEventsForMonth(
  _db: unknown,
  userId: string,
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const articles = await prisma.article.findMany({
    where: {
      ownerId: userId,
      scheduledDate: { gte: startDate, lte: endDate },
    },
  });

  return articles.map((a) => ({
    id: a.id,
    articleId: a.id,
    title: a.keyword || "Untitled Article",
    status: a.status as ArticleStatus,
    authorId: a.ownerId,
    authorName: "Author",
    scheduledDate: a.scheduledDate!,
  }));
}

export async function scheduleArticle(
  _db: unknown,
  articleId: string,
  userId: string,
  date: Date
): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.ownerId !== userId) throw new Error("Unauthorized: You do not own this article");

  const validStatuses: ArticleStatus[] = ["draft_generated", "optimized"];
  if (!validStatuses.includes(article.status as ArticleStatus)) {
    throw new Error("Cannot schedule article: Article must be in draft or later status");
  }

  await prisma.article.update({ where: { id: articleId }, data: { scheduledDate: date } });
}

export async function unscheduleArticle(
  _db: unknown,
  articleId: string,
  userId: string
): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.ownerId !== userId) throw new Error("Unauthorized: You do not own this article");

  await prisma.article.update({ where: { id: articleId }, data: { scheduledDate: null } });
}

export async function getUnscheduledArticles(
  _db: unknown,
  userId: string
): Promise<CalendarEvent[]> {
  const articles = await prisma.article.findMany({
    where: {
      ownerId: userId,
      scheduledDate: null,
      status: { in: ["draft_generated", "optimized"] },
    },
  });

  return articles.map((a) => ({
    id: a.id,
    articleId: a.id,
    title: a.keyword || "Untitled Article",
    status: a.status as ArticleStatus,
    authorId: a.ownerId,
    authorName: "Author",
    scheduledDate: new Date(),
  }));
}
