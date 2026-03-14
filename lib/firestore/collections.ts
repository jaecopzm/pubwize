/**
 * Firestore collection paths and helpers
 * Centralized location for all Firestore collection references
 */

// Main collections
export const COLLECTIONS = {
  USERS: 'users',
  SITES: 'sites',
  ARTICLES: 'articles',
} as const;

// Subcollections
export const SUBCOLLECTIONS = {
  // Article subcollections
  VERSIONS: 'versions',
  
  // User subcollections
  WORDPRESS_SITES: 'wordpressSites',
  TEMPLATES: 'templates',
  PREFERENCES: 'preferences',
} as const;

// Helper functions to build collection paths

/**
 * Get the path to an article's versions subcollection
 * Path: articles/{articleId}/versions
 */
export function getVersionsCollectionPath(articleId: string): string {
  return `${COLLECTIONS.ARTICLES}/${articleId}/${SUBCOLLECTIONS.VERSIONS}`;
}

/**
 * Get the path to a specific version snapshot
 * Path: articles/{articleId}/versions/{versionId}
 */
export function getVersionPath(articleId: string, versionId: string): string {
  return `${getVersionsCollectionPath(articleId)}/${versionId}`;
}

/**
 * Get the path to a user's WordPress sites subcollection
 * Path: users/{userId}/wordpressSites
 */
export function getWordPressSitesCollectionPath(userId: string): string {
  return `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.WORDPRESS_SITES}`;
}

/**
 * Get the path to a specific WordPress site
 * Path: users/{userId}/wordpressSites/{siteId}
 */
export function getWordPressSitePath(userId: string, siteId: string): string {
  return `${getWordPressSitesCollectionPath(userId)}/${siteId}`;
}

/**
 * Get the path to a user's templates subcollection
 * Path: users/{userId}/templates
 */
export function getTemplatesCollectionPath(userId: string): string {
  return `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.TEMPLATES}`;
}

/**
 * Get the path to a specific template
 * Path: users/{userId}/templates/{templateId}
 */
export function getTemplatePath(userId: string, templateId: string): string {
  return `${getTemplatesCollectionPath(userId)}/${templateId}`;
}

/**
 * Get the path to a user's preferences document
 * Path: users/{userId}/preferences/{docType}
 */
export function getUserPreferencePath(userId: string, docType: 'shortcuts' | 'theme'): string {
  return `${COLLECTIONS.USERS}/${userId}/${SUBCOLLECTIONS.PREFERENCES}/${docType}`;
}
