import type { 
  BriefData, 
  OutlineData, 
  DraftData, 
  OptimizationData, 
  SocialMediaData, 
  SiteBrandVoice 
} from "../types";

export type AIProvider = 'gemini' | 'openrouter' | 'groq';

export type TaskType = 'brief' | 'outline' | 'draft' | 'optimize' | 'social' | 'quick';

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  userId?: string;
  temperature?: number;
  maxTokens?: number;
  expectJSON?: boolean;
  taskType?: TaskType;
  useBulkModel?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  cached?: boolean;
}

export interface AIUsageLog {
  userId: string;
  provider: string;
  model: string;
  taskType: string;
  timestamp: number;
}

export interface ProviderStatus {
  provider: AIProvider;
  available: boolean;
  requestsInWindow: number;
  limit: number;
  circuitState?: 'closed' | 'open' | 'half-open';
  consecutiveFailures?: number;
}

export { 
  BriefData, 
  OutlineData, 
  DraftData, 
  OptimizationData, 
  SocialMediaData, 
  SiteBrandVoice 
};
