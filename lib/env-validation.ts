const requiredEnvVars = {
  DATABASE_URL: 'Neon Postgres Database URL',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'Clerk Publishable Key',
  CLERK_SECRET_KEY: 'Clerk Secret Key',
} as const;

const optionalEnvVars = {
  GEMINI_API_KEY: 'Google Gemini AI API Key',
  GROQ_API_KEY: 'Groq AI API Key',
  OPENROUTER_API_KEY: 'OpenRouter API Key',
  UNSPLASH_ACCESS_KEY: 'Unsplash Access Key',
  SERPER_API_KEY: 'Serper API Key',
  UPSTASH_REDIS_REST_URL: 'Upstash Redis URL (caching & rate limiting)',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis Token',
  RESEND_API_KEY: 'Resend Email API Key',
  NEXT_PUBLIC_APP_URL: 'App URL',
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: 'Paddle Client Token',
  PADDLE_API_KEY: 'Paddle API Key',
} as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    warnings.push('At least one AI provider key (GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY) - Recommended');
  }

  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      warnings.push(`${key} (${description}) - Optional but recommended`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (!result.valid) {
    console.error("Environment validation failed!");
    console.error("\nMissing required environment variables:");
    result.missing.forEach((msg) => console.error(`  - ${msg}`));

    if (result.warnings.length > 0) {
      console.warn("\nMissing optional environment variables:");
      result.warnings.forEach((msg) => console.warn(`  - ${msg}`));
    }

    throw new Error(
      "Missing required environment variables. Please check your .env file."
    );
  }

  if (result.warnings.length > 0) {
    console.warn("Environment validation warnings:");
    result.warnings.forEach((msg) => console.warn(`  - ${msg}`));
  }
}

export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasGroq: !!process.env.GROQ_API_KEY,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasUnsplash: !!process.env.UNSPLASH_ACCESS_KEY,
    hasSerper: !!process.env.SERPER_API_KEY,
    hasRedis: !!process.env.UPSTASH_REDIS_REST_URL,
  };
}
