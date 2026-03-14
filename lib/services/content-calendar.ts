/**
 * Content Calendar Service
 * Handles scheduling and managing article publication dates
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { CalendarEvent, ArticleStatus, FirestoreTimestamp } from '@/lib/types';
import { COLLECTIONS } from '@/lib/firestore/collections';

/**
 * Get all calendar events for a specific month
 * Returns articles scheduled for the given year and month
 */
export async function getEventsForMonth(
  db: Firestore,
  userId: string,
  year: number,
  month: number // 1-12
): Promise<CalendarEvent[]> {
  try {
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const articlesRef = collection(db, COLLECTIONS.ARTICLES);
    const q = query(
      articlesRef,
      where('ownerId', '==', userId),
      where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
      where('scheduledDate', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    
    const events: CalendarEvent[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const scheduledTimestamp = data.scheduledDate as FirestoreTimestamp;
      
      return {
        id: doc.id,
        articleId: doc.id,
        title: data.keyword || 'Untitled Article',
        status: data.status as ArticleStatus,
        authorId: data.ownerId,
        authorName: 'Author', // TODO: Fetch from user doc if needed
        scheduledDate: new Date(scheduledTimestamp.seconds * 1000),
      };
    });

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Schedule an article for a specific date
 * Validates that the article is in an appropriate status
 */
export async function scheduleArticle(
  db: Firestore,
  articleId: string,
  userId: string,
  date: Date
): Promise<void> {
  try {
    const articleRef = doc(db, COLLECTIONS.ARTICLES, articleId);
    const articleDoc = await getDoc(articleRef);

    if (!articleDoc.exists()) {
      throw new Error('Article not found');
    }

    const article = articleDoc.data();

    // Verify ownership
    if (article?.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this article');
    }

    // Validate article status - only draft and later stages can be scheduled
    const validStatuses: ArticleStatus[] = [
      'draft_generated',
      'optimized',
    ];

    if (!validStatuses.includes(article.status as ArticleStatus)) {
      throw new Error(
        'Cannot schedule article: Article must be in draft or later status'
      );
    }

    // Update the article with the scheduled date
    await updateDoc(articleRef, {
      scheduledDate: Timestamp.fromDate(date),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error scheduling article:', error);
    throw new Error(`Failed to schedule article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove the scheduled date from an article
 */
export async function unscheduleArticle(
  db: Firestore,
  articleId: string,
  userId: string
): Promise<void> {
  try {
    const articleRef = doc(db, COLLECTIONS.ARTICLES, articleId);
    const articleDoc = await getDoc(articleRef);

    if (!articleDoc.exists()) {
      throw new Error('Article not found');
    }

    const article = articleDoc.data();

    // Verify ownership
    if (article?.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this article');
    }

    // Remove the scheduled date
    await updateDoc(articleRef, {
      scheduledDate: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unscheduling article:', error);
    throw new Error(`Failed to unschedule article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update the scheduled date for an article (reschedule)
 */
export async function updateSchedule(
  db: Firestore,
  articleId: string,
  userId: string,
  newDate: Date
): Promise<void> {
  try {
    // This is essentially the same as scheduling, but we're being explicit
    await scheduleArticle(db, articleId, userId, newDate);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error(`Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all unscheduled articles for a user
 * Returns articles that don't have a scheduled date
 */
export async function getUnscheduledArticles(
  db: Firestore,
  userId: string
): Promise<CalendarEvent[]> {
  try {
    const articlesRef = collection(db, COLLECTIONS.ARTICLES);
    
    // Query for articles without a scheduled date
    const q = query(
      articlesRef,
      where('ownerId', '==', userId),
      where('scheduledDate', '==', null)
    );

    const snapshot = await getDocs(q);
    
    const articles: CalendarEvent[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        
        // Only include articles in draft or later status
        const validStatuses: ArticleStatus[] = [
          'draft_generated',
          'optimized',
        ];
        
        if (!validStatuses.includes(data.status as ArticleStatus)) {
          return null;
        }
        
        return {
          id: doc.id,
          articleId: doc.id,
          title: data.keyword || 'Untitled Article',
          status: data.status as ArticleStatus,
          authorId: data.ownerId,
          authorName: 'Author',
          scheduledDate: new Date(), // Placeholder, not actually scheduled
        };
      })
      .filter((article): article is CalendarEvent => article !== null);

    return articles;
  } catch (error) {
    console.error('Error fetching unscheduled articles:', error);
    throw new Error(`Failed to fetch unscheduled articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
