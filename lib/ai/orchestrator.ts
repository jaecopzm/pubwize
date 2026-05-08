import { AIRequest, AIResponse, AIProvider, ProviderStatus } from "./types";
import { 
  TASK_PROVIDERS, 
  DEFAULT_PRIORITY, 
  RATE_LIMITS, 
  RATE_LIMIT_WINDOW,
  CACHE_TTL,
  REQUEST_TIMEOUT_MS
} from "./config";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { OpenRouterProvider } from "./providers/openrouter";
import { AIProviderInstance } from "./providers/base";
import { 
  LRUCache, 
  CircuitBreaker, 
  calcBackoff, 
  sleep, 
  classifyError 
} from "./utils/resilience";
import { AsyncLocalStorage } from "async_hooks";
import crypto from "crypto";

// Carries the current userId through async AI call chains
export const aiUserContext = new AsyncLocalStorage<string>();

const providers: Record<AIProvider, AIProviderInstance> = {
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
  openrouter: new OpenRouterProvider()
};

// Production-grade LRU cache: max 500 entries, 5-minute TTL
const cache = new LRUCache<{ content: string; provider: AIProvider; model: string }>(
  500,
  CACHE_TTL
);

// Rate limit tracking
const rateLimitMap = new Map<AIProvider, number[]>();

// Circuit breaker to avoid hammering dead providers
const circuit = new CircuitBreaker();

/**
 * Produces a stable SHA-256 hash of the full request for cache keying.
 * More reliable than truncating prompts to 100 chars.
 */
function getCacheKey(request: AIRequest): string {
  const payload = JSON.stringify({
    system: request.systemPrompt,
    user: request.userPrompt,
    temp: request.temperature ?? 0.7,
    maxTokens: request.maxTokens,
    json: request.expectJSON ?? false,
    taskType: request.taskType
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function checkRateLimit(provider: AIProvider): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(provider) || [];
  const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recent.length >= RATE_LIMITS[provider]) return false;

  recent.push(now);
  rateLimitMap.set(provider, recent);
  return true;
}

async function logAIUsage(userId: string, data: {
  provider: string;
  model: string;
  taskType: string;
  cached?: boolean;
}) {
  // Structured log format — easy to parse in log aggregators (Datadog, Logtail, etc.)
  console.log(JSON.stringify({
    level: "info",
    event: "ai_usage",
    userId,
    ...data,
    ts: new Date().toISOString()
  }));
}

export async function generateAI(request: AIRequest): Promise<AIResponse> {
  const cacheKey = getCacheKey(request);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    const userId = request.userId ?? aiUserContext.getStore();
    if (userId) {
      logAIUsage(userId, {
        provider: cached.provider,
        model: cached.model,
        taskType: request.taskType ?? "unknown",
        cached: true
      }).catch(() => {});
    }
    return { ...cached, cached: true };
  }

  const providerOrder = request.taskType ? TASK_PROVIDERS[request.taskType] : DEFAULT_PRIORITY;
  const errors: string[] = [];
  let attempt = 0;

  for (const providerKey of providerOrder) {
    // 1. Skip if circuit is open (provider is known-bad)
    if (circuit.isOpen(providerKey)) {
      errors.push(`${providerKey}: circuit open`);
      console.warn(`[AI] Circuit OPEN for ${providerKey}, skipping.`);
      continue;
    }

    // 2. Skip if we've already locally rate-limited this provider
    if (!checkRateLimit(providerKey)) {
      errors.push(`${providerKey}: local rate limit`);
      continue;
    }

    try {
      const provider = providers[providerKey];

      // 3. Enforce a per-request timeout via AbortController
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response: AIResponse;
      try {
        response = await provider.generate(request, controller.signal);
      } finally {
        clearTimeout(timeout);
      }

      // 4. Cache and log on success
      cache.set(cacheKey, {
        content: response.content,
        provider: response.provider,
        model: response.model
      });

      circuit.onSuccess(providerKey);

      const userId = request.userId ?? aiUserContext.getStore();
      if (userId) {
        logAIUsage(userId, {
          provider: response.provider,
          model: response.model,
          taskType: request.taskType ?? "unknown"
        }).catch(() => {});
      }

      console.log(JSON.stringify({
        level: "info",
        event: "ai_success",
        provider: providerKey,
        model: response.model,
        taskType: request.taskType
      }));

      return response;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const classification = classifyError(error);
      errors.push(`${providerKey}: ${msg}`);

      console.warn(JSON.stringify({
        level: "warn",
        event: "ai_provider_failed",
        provider: providerKey,
        taskType: request.taskType,
        isRateLimit: classification.isRateLimit,
        isServerError: classification.isServerError,
        statusCode: classification.statusCode,
        message: msg.slice(0, 200)
      }));

      // 5. Update circuit breaker (not for rate limits — those are transient)
      circuit.onFailure(providerKey, classification.isRateLimit);

      // 6. Apply exponential backoff before trying the next provider
      if (classification.isRetryable && attempt < providerOrder.length - 1) {
        const delay = calcBackoff(attempt);
        console.log(`[AI] Retryable error. Backing off ${delay.toFixed(0)}ms before next provider...`);
        await sleep(delay);
      }

      attempt++;
    }
  }

  console.error(JSON.stringify({
    level: "error",
    event: "ai_all_providers_failed",
    taskType: request.taskType,
    errors
  }));

  throw new Error(`All AI providers failed [task=${request.taskType}]: ${errors.join('; ')}`);
}

export async function* generateAIStream(request: AIRequest): AsyncGenerator<string> {
  const providerOrder = request.taskType ? TASK_PROVIDERS[request.taskType] : DEFAULT_PRIORITY;
  let attempt = 0;

  for (const providerKey of providerOrder) {
    if (circuit.isOpen(providerKey)) continue;
    if (!checkRateLimit(providerKey)) continue;

    try {
      const provider = providers[providerKey];
      if (provider.stream) {
        yield* provider.stream(request);
        circuit.onSuccess(providerKey);
        return;
      }
    } catch (error) {
      const classification = classifyError(error);
      circuit.onFailure(providerKey, classification.isRateLimit);

      if (classification.isRetryable && attempt < providerOrder.length - 1) {
        await sleep(calcBackoff(attempt));
      }
      attempt++;
      console.warn(`[AI] Streaming provider ${providerKey} failed, trying next...`, error);
    }
  }

  throw new Error(`All streaming providers failed [task=${request.taskType}]`);
}

export function getProviderStatus(): ProviderStatus[] {
  const now = Date.now();
  return (Object.keys(RATE_LIMITS) as AIProvider[]).map(provider => {
    const requests = rateLimitMap.get(provider) || [];
    const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    const circuitStatus = circuit.getStatus(provider);
    return {
      provider,
      available: recent.length < RATE_LIMITS[provider] && !circuit.isOpen(provider),
      requestsInWindow: recent.length,
      limit: RATE_LIMITS[provider],
      circuitState: circuitStatus.state,
      consecutiveFailures: circuitStatus.failures
    };
  });
}

export function getCacheStats() {
  return { size: cache.size, maxSize: 500 };
}
