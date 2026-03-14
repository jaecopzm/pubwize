/**
 * Version History Service
 * Handles creating, retrieving, and restoring article version snapshots
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { 
  VersionSnapshot, 
  ArticleDoc, 
  BriefData, 
  OutlineData, 
  DraftData,
  ArticleSettings,
} from '@/lib/types';
import {
  fetchVersionSnapshots,
  fetchVersionSnapshot,
  createVersionSnapshot as createSnapshotDoc,
  archiveVersionSnapshot,
  countVersionSnapshots,
  getVersionSnapshotRef,
} from '@/lib/firestore/version-snapshots';
import { COLLECTIONS } from '@/lib/firestore/collections';

/**
 * Create a snapshot of the current article state
 * This should be called before any modification to preserve history
 */
export async function createSnapshot(
  db: Firestore,
  articleId: string,
  userId: string,
  changeDescription: string
): Promise<string> {
  try {
    // Use a transaction to ensure atomicity
    const snapshotId = await runTransaction(db, async (transaction) => {
      // Get the current article state
      const articleRef = doc(db, COLLECTIONS.ARTICLES, articleId);
      const articleDoc = await transaction.get(articleRef);
      
      if (!articleDoc.exists()) {
        throw new Error('Article not found');
      }
      
      const article = articleDoc.data() as ArticleDoc;
      
      // Verify ownership
      if (article.ownerId !== userId) {
        throw new Error('Unauthorized: You do not own this article');
      }
      
      // Determine content type based on what's present
      let contentType: 'brief' | 'outline' | 'draft' = 'draft';
      if (article.draft) {
        contentType = 'draft';
      } else if (article.outline) {
        contentType = 'outline';
      } else if (article.brief) {
        contentType = 'brief';
      }
      
      // Create snapshot data
      const snapshotId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const snapshotData: Omit<VersionSnapshot, 'id' | 'timestamp'> = {
        articleId,
        userId,
        changeDescription,
        contentType,
        snapshot: {
          brief: article.brief || undefined,
          outline: article.outline || undefined,
          draft: article.draft || undefined,
          settings: article.settings,
        },
        archived: false,
      };
      
      // Create the snapshot document
      const snapshotRef = getVersionSnapshotRef(db, articleId, snapshotId);
      transaction.set(snapshotRef, {
        ...snapshotData,
        timestamp: serverTimestamp(),
      });
      
      return snapshotId;
    });
    
    return snapshotId;
  } catch (error) {
    console.error('Error creating snapshot:', error);
    throw new Error(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all snapshots for an article
 * Returns snapshots in reverse chronological order (newest first)
 */
export async function getSnapshots(
  db: Firestore,
  articleId: string,
  options?: {
    limit?: number;
    includeArchived?: boolean;
  }
): Promise<VersionSnapshot[]> {
  try {
    return await fetchVersionSnapshots(db, articleId, options);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw new Error(`Failed to fetch snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a specific snapshot by ID
 */
export async function getSnapshot(
  db: Firestore,
  articleId: string,
  snapshotId: string
): Promise<VersionSnapshot | null> {
  try {
    return await fetchVersionSnapshot(db, articleId, snapshotId);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    throw new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore an article to a previous snapshot
 * Creates a new snapshot of the current state before restoring
 */
export async function restoreSnapshot(
  db: Firestore,
  articleId: string,
  snapshotId: string,
  userId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get the article
      const articleRef = doc(db, COLLECTIONS.ARTICLES, articleId);
      const articleDoc = await transaction.get(articleRef);
      
      if (!articleDoc.exists()) {
        throw new Error('Article not found');
      }
      
      const article = articleDoc.data() as ArticleDoc;
      
      // Verify ownership
      if (article.ownerId !== userId) {
        throw new Error('Unauthorized: You do not own this article');
      }
      
      // Get the snapshot to restore
      const snapshotRef = getVersionSnapshotRef(db, articleId, snapshotId);
      const snapshotDoc = await transaction.get(snapshotRef);
      
      if (!snapshotDoc.exists()) {
        throw new Error('Snapshot not found');
      }
      
      const snapshot = snapshotDoc.data() as Omit<VersionSnapshot, 'id'>;
      
      // Create a backup snapshot of current state before restoring
      const backupSnapshotId = `${Date.now()}-backup-${Math.random().toString(36).substring(7)}`;
      const backupSnapshotRef = getVersionSnapshotRef(db, articleId, backupSnapshotId);
      
      let currentContentType: 'brief' | 'outline' | 'draft' = 'draft';
      if (article.draft) {
        currentContentType = 'draft';
      } else if (article.outline) {
        currentContentType = 'outline';
      } else if (article.brief) {
        currentContentType = 'brief';
      }
      
      transaction.set(backupSnapshotRef, {
        articleId,
        userId,
        changeDescription: `Backup before restoring to snapshot ${snapshotId}`,
        contentType: currentContentType,
        snapshot: {
          brief: article.brief || undefined,
          outline: article.outline || undefined,
          draft: article.draft || undefined,
          settings: article.settings,
        },
        archived: false,
        timestamp: serverTimestamp(),
      });
      
      // Restore the article to the snapshot state
      const updates: Partial<ArticleDoc> = {
        brief: snapshot.snapshot.brief || null,
        outline: snapshot.snapshot.outline || null,
        draft: snapshot.snapshot.draft || null,
        settings: snapshot.snapshot.settings || article.settings,
        updatedAt: serverTimestamp() as any,
      };
      
      transaction.update(articleRef, updates);
    });
  } catch (error) {
    console.error('Error restoring snapshot:', error);
    throw new Error(`Failed to restore snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Archive old snapshots for an article
 * Archives snapshots older than the specified date
 * Keeps the most recent snapshots unarchived
 */
export async function archiveOldSnapshots(
  db: Firestore,
  articleId: string,
  olderThan: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
): Promise<number> {
  try {
    // Get all snapshots
    const snapshots = await fetchVersionSnapshots(db, articleId, { 
      includeArchived: false 
    });
    
    // If there are 100 or fewer snapshots, don't archive anything
    if (snapshots.length <= 100) {
      return 0;
    }
    
    // Archive snapshots older than the specified date
    let archivedCount = 0;
    const cutoffTime = olderThan.getTime();
    
    for (const snapshot of snapshots) {
      const snapshotTime = snapshot.timestamp.seconds * 1000;
      
      if (snapshotTime < cutoffTime) {
        await archiveVersionSnapshot(db, articleId, snapshot.id);
        archivedCount++;
      }
    }
    
    return archivedCount;
  } catch (error) {
    console.error('Error archiving old snapshots:', error);
    throw new Error(`Failed to archive snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the total count of snapshots for an article
 */
export async function getSnapshotCount(
  db: Firestore,
  articleId: string,
  includeArchived: boolean = false
): Promise<number> {
  try {
    return await countVersionSnapshots(db, articleId, includeArchived);
  } catch (error) {
    console.error('Error counting snapshots:', error);
    throw new Error(`Failed to count snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
