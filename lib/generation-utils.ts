/**
 * Robust generation utilities with retry logic and error handling
 */

export interface GenerationOptions {
  maxRetries?: number;
  timeout?: number;
  onProgress?: (message: string) => void;
}

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly isLimitError: boolean = false
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: GenerationOptions = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 60000, onProgress } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        onProgress?.(`Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new GenerationError('Request timed out', 'TIMEOUT', true));
            });
          })
        ]);
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (error instanceof GenerationError && !error.retryable) {
        throw error;
      }

      // Network errors are retryable
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < maxRetries) continue;
      }

      // Timeout errors are retryable
      if (error instanceof GenerationError && error.code === 'TIMEOUT') {
        if (attempt < maxRetries) continue;
      }

      // Don't retry on final attempt
      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Unknown error');
}

/**
 * Generate with progress tracking
 */
export async function generateWithProgress<T>(
  endpoint: string,
  body: any,
  idToken: string,
  options: GenerationOptions = {}
): Promise<T> {
  const { onProgress } = options;

  return withRetry(async () => {
    onProgress?.('Sending request...');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unknown error' }));
      
      // Classify errors
      if (res.status === 401) {
        throw new GenerationError('Authentication failed', 'AUTH_FAILED', false, false);
      }
      if (res.status === 403) {
        const isLimit = data.error?.toLowerCase().includes('limit') || 
                       data.error?.toLowerCase().includes('reached') ||
                       data.limit !== undefined;
        throw new GenerationError(data.error || 'Access denied', 'FORBIDDEN', false, isLimit);
      }
      if (res.status === 429) {
        throw new GenerationError('Rate limit exceeded', 'RATE_LIMIT', true, false);
      }
      if (res.status >= 500) {
        throw new GenerationError(data.error || 'Server error', 'SERVER_ERROR', true, false);
      }

      throw new GenerationError(data.error || 'Request failed', 'REQUEST_FAILED', false, false);
    }

    onProgress?.('Processing response...');
    return await res.json();
  }, options);
}

/**
 * Validate generation input
 */
export function validateGenerationInput(keyword: string, siteId: string): string | null {
  if (!keyword?.trim()) {
    return 'Keyword is required';
  }
  if (keyword.trim().length < 3) {
    return 'Keyword must be at least 3 characters';
  }
  if (keyword.trim().length > 200) {
    return 'Keyword is too long (max 200 characters)';
  }
  if (!siteId?.trim()) {
    return 'Please select a site';
  }
  return null;
}
