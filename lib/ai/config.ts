import { AIProvider, TaskType } from "./types";

export const MODELS = {
  gemini: {
    fast: "gemini-2.5-flash-lite",
    json: "gemini-2.5-flash-lite",
    draft: "gemini-2.5-flash-lite" // Use lite for better availability
  },
  openrouter: {
    fast: "meta-llama/llama-3.3-70b-instruct:free",
    json: "meta-llama/llama-3.3-70b-instruct:free",
    draft: "meta-llama/llama-3.3-70b-instruct:free"
  },
  groq: {
    fast: "llama-3.1-8b-instant",
    json: "llama-3.1-8b-instant",
    draft: "openai/gpt-oss-120b",
    fallback1: "llama-3.3-70b-versatile",
    fallback2: "llama-3.1-8b-instant"
  }
};

export const TASK_PROVIDERS: Record<TaskType, AIProvider[]> = {
  brief: ['groq', 'openrouter', 'gemini'],
  outline: ['groq', 'openrouter', 'gemini'],
  draft: ['groq', 'openrouter', 'gemini'],
  optimize: ['gemini', 'openrouter', 'groq'],
  social: ['gemini', 'openrouter', 'groq'],
  quick: ['groq', 'gemini', 'openrouter']
};

export const DEFAULT_PRIORITY: AIProvider[] = ['groq', 'openrouter', 'gemini'];

export const RATE_LIMITS: Record<AIProvider, number> = {
  gemini: 15,
  openrouter: 20,
  groq: 30
};

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
export const REQUEST_TIMEOUT_MS = 90 * 1000; // 90 seconds per request
