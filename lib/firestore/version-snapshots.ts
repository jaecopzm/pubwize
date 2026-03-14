/**
 * Firestore helpers for version snapshots
 * Provides type-safe functions for working with article version history
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { VersionSnapshot, ArticleDoc, FirestoreTimestamp } from '@/lib/types';
import { getVersionsCollectionPath, getVersionPath } from './collections';

/**
 * Convert Firestore Timestamp to FirestoreTimestamp type
 */
function toFirestoreTimestamp(timestamp: Timestamp): FirestoreTimestamp {
  return {
    seconds: timestamp.seconds,
    nanoseconds: timestamp.nanoseconds,
  };
}

/**
 * Create a version snapshot document reference
 */
export function getVersionSnapshotRef(db: Firestore, articleId: string, versionId: string) {
  const path = getVersionPath(articleId, versionId);
  return doc(db, path);
}

/**
 * Create a version snapshots collection reference
 */
export function getVersionSnapshotsCollection(db: Firestore, articleId: string) {
  const path = getVersionsCollectionPath(articleId);
  return collection(db, path);
}

/**
 * Query version snapshots for an article
 * Returns snapshots ordered by timestamp (newest first)
 */
export function queryVersionSnapshots(
  db: Firestore,
  articleId: string,
  options?: {
    limit?: number;
    includeArchived?: boolean;
  }
) {
  const collectionRef = getVersionSnapshotsCollection(db, articleId);
  
  let q = query(
    collectionRef,
    orderBy('timestamp', 'desc')
  );
  
  // Filter out archived snapshots unless explicitly requested
  if (!options?.includeArchived) {
    q = query(q, where('archived', '==', false));
  }
  
  // Apply limit if specified
  if (options?.limit) {
    q = query(q, firestoreLimit(options.limit));
  }
  
  return q;
}

/**
 * Query archived version snapshots
 * Used for cleanup operations
 */
export function queryArchivedSnapshots(
  db: Firestore,
  articleId: string,
  olderThan: Date
) {
  const collectionRef = getVersionSnapshotsCollection(db, articleId);
  
  return query(
    collectionRef,
    where('archived', '==', true),
    where('timestamp', '<', Timestamp.fromDate(olderThan)),
    orderBy('timestamp', 'asc')
  );
}

/**
 * Fetch version snapshots for an article
 */
export async function fetchVersionSnapshots(
  db: Firestore,
  articleId: string,
  options?: {
    limit?: number;
    includeArchived?: boolean;
  }
): Promise<VersionSnapshot[]> {
  const q = queryVersionSnapshots(db, articleId, options);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      articleId: data.articleId,
      userId: data.userId,
      timestamp: toFirestoreTimestamp(data.timestamp),
      changeDescription: data.changeDescription,
      contentType: data.contentType,
      snapshot: data.snapshot,
      archived: data.archived ?? false,
    } as VersionSnapshot;
  });
}

/**
 * Fetch a single version snapshot
 */
export async function fetchVersionSnapshot(
  db: Firestore,
  articleId: string,
  versionId: string
): Promise<VersionSnapshot | null> {
  const docRef = getVersionSnapshotRef(db, articleId, versionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    articleId: data.articleId,
    userId: data.userId,
    timestamp: toFirestoreTimestamp(data.timestamp),
    changeDescription: data.changeDescription,
    contentType: data.contentType,
    snapshot: data.snapshot,
    archived: data.archived ?? false,
  } as VersionSnapshot;
}

/**
 * Create a version snapshot
 * Note: This is a low-level function. Use the version history service for business logic.
 */
export async function createVersionSnapshot(
  db: Firestore,
  articleId: string,
  versionId: string,
  data: Omit<VersionSnapshot, 'id' | 'timestamp'>
): Promise<void> {
  const docRef = getVersionSnapshotRef(db, articleId, versionId);
  
  await setDoc(docRef, {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/**
 * Archive a version snapshot
 */
export async function archiveVersionSnapshot(
  db: Firestore,
  articleId: string,
  versionId: string
): Promise<void> {
  const docRef = getVersionSnapshotRef(db, articleId, versionId);
  
  await updateDoc(docRef, {
    archived: true,
  });
}

/**
 * Count version snapshots for an article
 */
export async function countVersionSnapshots(
  db: Firestore,
  articleId: string,
  includeArchived: boolean = false
): Promise<number> {
  const q = queryVersionSnapshots(db, articleId, { includeArchived });
  const snapshot = await getDocs(q);
  return snapshot.size;
}
