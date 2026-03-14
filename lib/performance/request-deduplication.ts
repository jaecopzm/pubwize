/**
 * Request Deduplication
 * Prevent duplicate API calls
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Deduplicate API requests
 * If same request is made within cache duration, return cached promise
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  cacheDuration: number = CACHE_DURATION
): Promise<T> {
  const now = Date.now();
  const pending = pendingRequests.get(key);

  // Return cached promise if still valid
  if (pending && now - pending.timestamp < cacheDuration) {
    return pending.promise;
  }

  // Create new request
  const promise = requestFn();
  pendingRequests.set(key, { promise, timestamp: now });

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up after request completes
    setTimeout(() => {
      const current = pendingRequests.get(key);
      if (current && current.timestamp === now) {
        pendingRequests.delete(key);
      }
    }, cacheDuration);
  }
}

/**
 * Clear all pending requests
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}

/**
 * Clear specific request
 */
export function clearRequest(key: string) {
  pendingRequests.delete(key);
}

/**
 * Get pending request count
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}
