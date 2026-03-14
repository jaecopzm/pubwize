# AI Provider System

PubWize now uses a unified AI provider system with automatic fallbacks, caching, and rate limiting across three providers:

## Task-Specific Provider Assignment

PubWize intelligently assigns providers based on task requirements:

### 📝 Brief & Outline Generation
- **Primary**: OpenRouter (`nvidia/nemotron-3-nano-30b-a3b`)
- **Why**: Excellent at structured JSON output, reliable formatting
- **Fallback**: Groq → Gemini

### ✍️ Draft Generation (Heavy Content)
- **Primary**: Groq (`llama-3.3-70b-versatile`)
- **Why**: Fastest responses (sub-second), best for long-form content
- **Fallback**: OpenRouter → Gemini

### 🔧 Optimization & Quick Tasks
- **Primary**: Gemini (`gemini-2.5-flash-lite`)
- **Why**: Preserves higher-limit providers for heavy tasks
- **Fallback**: OpenRouter → Groq

This ensures optimal performance while maximizing free tier usage across all providers.

## Features

### ✅ Automatic Fallback
- Tries providers in order: Groq → OpenRouter → Gemini
- Switches instantly if a provider is rate-limited or fails
- No user-facing errors unless all providers fail

### ✅ Smart Caching
- 5-minute TTL for identical requests
- Reduces API calls and improves response times
- Cache key based on prompt content and parameters

### ✅ Rate Limiting
- Per-provider request tracking
- Prevents hitting API limits
- Automatic provider switching when limits approached

### ✅ Error Handling
- Comprehensive error logging
- Graceful degradation
- Detailed error messages for debugging

## Usage

### Basic AI Generation
```typescript
import { generateAI } from "@/lib/ai-providers";

const response = await generateAI({
  systemPrompt: "You are a helpful assistant.",
  userPrompt: "Write about AI in content creation.",
  temperature: 0.7,
  maxTokens: 1000
});

console.log(`Response from ${response.provider}: ${response.content}`);
```

### JSON Generation
```typescript
import { generateAIJSON } from "@/lib/ai-providers";

const data = await generateAIJSON<{ title: string; summary: string }>({
  systemPrompt: "Return JSON with title and summary fields.",
  userPrompt: "Analyze this article...",
});
```

### High-Level Functions
```typescript
import { generateBrief, generateOutline, generateDraft } from "@/lib/ai-providers";

// These automatically use the best available provider
const brief = await generateBrief({ keyword: "AI content", siteContext: {...} });
const outline = await generateOutline({ brief });
const draft = await generateDraft({ outline, keyword: "AI content", tone: "professional" });
```

## Monitoring

### Provider Status API
```bash
GET /api/ai/test
```

Returns current status of all providers:
```json
{
  "success": true,
  "providers": [
    {
      "provider": "groq",
      "available": true,
      "requestsInWindow": 5,
      "limit": 30
    }
  ]
}
```

### Test Generation API
```bash
POST /api/ai/test
Content-Type: application/json

{
  "prompt": "Test prompt",
  "expectJSON": false
}
```

### Dashboard
Visit `/ai-test` to see the live provider dashboard with:
- Real-time provider status
- Rate limit monitoring
- Interactive testing
- Performance metrics

## Migration

### Existing Code
Your existing Gemini functions now automatically use the new system:
- `generateBriefWithGemini()` → Uses best available provider
- `generateOutlineWithGemini()` → Uses best available provider
- `generateDraftWithGemini()` → Uses best available provider
- `optimizeDraftWithGemini()` → Uses best available provider

No code changes required! The functions maintain the same interface but now have robust fallbacks.

### New Code
For new features, use the unified functions:
```typescript
import { generateAI, generateAIJSON } from "@/lib/ai-providers";
```

## Configuration

### Environment Variables
```bash
# Required - at least one must be set
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key  
GROQ_API_KEY=your_groq_key

# Optional
OPENROUTER_TIMEOUT_MS=120000  # Request timeout
```

### Getting API Keys

#### Groq (Recommended)
1. Visit [console.groq.com](https://console.groq.com/keys)
2. Sign up with GitHub/Google
3. Create API key
4. Add to `.env.local`: `GROQ_API_KEY=your_key`

#### OpenRouter
1. Visit [openrouter.ai](https://openrouter.ai/keys)
2. Sign up and verify email
3. Create API key
4. Add to `.env.local`: `OPENROUTER_API_KEY=your_key`

#### Gemini
1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Create Google account if needed
3. Generate API key
4. Add to `.env.local`: `GEMINI_API_KEY=your_key`

## Benefits

### For Users
- **Faster responses**: Groq provides sub-second generation
- **Higher reliability**: 3x redundancy means 99.9% uptime
- **Better quality**: Can use the best model for each task
- **No interruptions**: Seamless fallbacks during rate limits

### For Development
- **Cost optimization**: Maximize free tier usage across providers
- **Easy scaling**: Add new providers without code changes
- **Better debugging**: Detailed logging and monitoring
- **Future-proof**: Easy to swap models and providers

## Troubleshooting

### All Providers Failing
1. Check API keys in `.env.local`
2. Verify network connectivity
3. Check provider status pages
4. Review error logs in console

### Rate Limiting
- Normal behavior - system will auto-switch providers
- Monitor `/ai-test` dashboard for usage patterns
- Consider upgrading to paid tiers for higher limits

### Slow Responses
- Groq should be fastest (< 1s)
- OpenRouter typically 2-5s
- Gemini can be 5-10s
- Check which provider is being used in response

## Setup Script

Run the setup script to verify configuration:
```bash
./scripts/setup-ai.sh
```

This checks API keys, tests connectivity, and provides setup guidance.
