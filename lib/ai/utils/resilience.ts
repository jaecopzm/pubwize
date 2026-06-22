import { AIProvider } from "../types";

/**
 * Production-grade LRU cache with bounded size and TTL eviction.
 * Prevents memory leaks from unbounded Map growth.
 */
export class LRUCache<V> {
  private cache = new Map<string, { value: V; timestamp: number }>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Exponential backoff with jitter for retries.
 * Prevents "thundering herd" when all clients retry simultaneously.
 */
export function calcBackoff(attempt: number, baseMs = 500, maxMs = 10000): number {
  const exponential = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  const jitter = Math.random() * exponential * 0.2; // 20% jitter
  return exponential + jitter;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breaker state per provider.
 * Tracks consecutive failures and opens the circuit to stop calling a dead provider.
 */
interface CircuitState {
  failures: number;
  lastFailureAt: number;
  state: 'closed' | 'open' | 'half-open';
}

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_TIMEOUT_MS = 30_000; // 30 seconds

export class CircuitBreaker {
  private circuits = new Map<AIProvider, CircuitState>();

  isOpen(provider: AIProvider): boolean {
    const circuit = this.circuits.get(provider);
    if (!circuit || circuit.state === 'closed') return false;
    if (circuit.state === 'open') {
      const timeSinceFailure = Date.now() - circuit.lastFailureAt;
      if (timeSinceFailure > CIRCUIT_RESET_TIMEOUT_MS) {
        circuit.state = 'half-open';
        return false; // Allow one test request through
      }
      return true; // Still open, skip this provider
    }
    return false; // half-open: let it try
  }

  onSuccess(provider: AIProvider): void {
    this.circuits.delete(provider); // Reset to clean closed state
  }

  onFailure(provider: AIProvider, isRateLimit: boolean): void {
    // Rate limits are temporary — don't count them toward circuit breaker
    if (isRateLimit) return;

    const circuit = this.circuits.get(provider) ?? { failures: 0, lastFailureAt: 0, state: 'closed' as const };
    circuit.failures += 1;
    circuit.lastFailureAt = Date.now();

    if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
      circuit.state = 'open';
      console.warn(`[Circuit] Provider ${provider} circuit OPENED after ${circuit.failures} failures.`);
    }
    this.circuits.set(provider, circuit);
  }

  getStatus(provider: AIProvider): CircuitState {
    return this.circuits.get(provider) ?? { failures: 0, lastFailureAt: 0, state: 'closed' };
  }
}

/**
 * Classifies error by HTTP status code or message pattern.
 */
export interface ErrorClassification {
  isRateLimit: boolean;
  isServerError: boolean;
  isClientError: boolean;
  isTimeout: boolean;
  isRetryable: boolean;
  statusCode?: number;
}

export function classifyError(error: unknown): ErrorClassification {
  const msg = error instanceof Error ? error.message : String(error);
  const errObj = error as any;

  // Try multiple strategies to extract status code:
  // 1. Direct property (fetch Response, Axios error, etc.)
  let statusCode: number | undefined =
    errObj?.status ?? errObj?.statusCode ?? errObj?.response?.status;

  // 2. Provider-specific error messages
  if (statusCode === undefined) {
    const statusPatterns = [
      /:\s*(\d{3})\s*-/,       // "error: 429 -"
      /status\s*(\d{3})/i,     // "status 429"
      /HTTP\s*(\d{3})/i,       // "HTTP 429"
      /(\d{3})\s+error/i,      // "429 error"
    ];
    for (const pattern of statusPatterns) {
      const m = msg.match(pattern);
      if (m) { statusCode = parseInt(m[1], 10); break; }
    }
  }

  const isRateLimit =
    statusCode === 429 ||
    msg.includes("rate_limit_exceeded") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("too many requests");

  const isServerError =
    (statusCode !== undefined && statusCode >= 500) ||
    msg.toLowerCase().includes("service unavailable") ||
    msg.toLowerCase().includes("overloaded");

  const isTimeout =
    msg.toLowerCase().includes("timeout") ||
    msg.toLowerCase().includes("etimedout") ||
    msg.toLowerCase().includes("aborted");

  const isClientError =
    statusCode !== undefined &&
    statusCode >= 400 &&
    statusCode < 500 &&
    !isRateLimit;

  return {
    isRateLimit,
    isServerError,
    isTimeout,
    isClientError,
    isRetryable: isRateLimit || isServerError || isTimeout,
    statusCode,
  };
}
