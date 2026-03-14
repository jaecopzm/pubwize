/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 * Fails fast if critical variables are missing
 */

const requiredEnvVars = {
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: 'Firebase API Key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'Firebase Auth Domain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'Firebase Project ID',
  FIREBASE_ADMIN_PROJECT_ID: 'Firebase Admin Project ID',
  FIREBASE_ADMIN_CLIENT_EMAIL: 'Firebase Admin Client Email',
  FIREBASE_ADMIN_PRIVATE_KEY: 'Firebase Admin Private Key',
  
  // AI Providers (at least one required)
  // GEMINI_API_KEY or OPENROUTER_API_KEY
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: 'Upstash Redis URL',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis Token',
} as const;

const optionalEnvVars = {
  GEMINI_API_KEY: 'Google Gemini API Key',
  OPENROUTER_API_KEY: 'OpenRouter API Key',
  UNSPLASH_ACCESS_KEY: 'Unsplash Access Key',
  SERPER_API_KEY: 'Serper API Key',
  NEXT_PUBLIC_APP_URL: 'App URL',
} as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 * Returns validation result with missing/warning variables
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }

  // Check AI provider (at least one required)
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    missing.push('GEMINI_API_KEY or OPENROUTER_API_KEY (AI Provider)');
  }

  // Check optional but recommended variables
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

/**
 * Validate environment and throw error if invalid
 * Call this on app startup
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed!');
    console.error('\nMissing required environment variables:');
    result.missing.forEach((msg) => console.error(`  - ${msg}`));
    
    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Missing optional environment variables:');
      result.warnings.forEach((msg) => console.warn(`  - ${msg}`));
    }

    throw new Error(
      'Missing required environment variables. Please check your .env file.'
    );
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach((msg) => console.warn(`  - ${msg}`));
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment info for debugging
 */
export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    hasUnsplash: !!process.env.UNSPLASH_ACCESS_KEY,
    hasSerper: !!process.env.SERPER_API_KEY,
    hasRedis: !!process.env.UPSTASH_REDIS_REST_URL,
  };
}
