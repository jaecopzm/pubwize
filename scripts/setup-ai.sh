#!/bin/bash

echo "🚀 Setting up AI providers for PubWize..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Check existing API keys
echo "📋 Checking current API key status:"

if grep -q "GEMINI_API_KEY=" .env.local && [ -n "$(grep "GEMINI_API_KEY=" .env.local | cut -d'=' -f2)" ]; then
    echo "✅ Gemini API key: Set"
else
    echo "❌ Gemini API key: Missing"
fi

if grep -q "OPENROUTER_API_KEY=" .env.local && [ -n "$(grep "OPENROUTER_API_KEY=" .env.local | cut -d'=' -f2)" ]; then
    echo "✅ OpenRouter API key: Set"
else
    echo "❌ OpenRouter API key: Missing"
fi

if grep -q "GROQ_API_KEY=" .env.local && [ -n "$(grep "GROQ_API_KEY=" .env.local | cut -d'=' -f2)" ]; then
    echo "✅ Groq API key: Set"
else
    echo "❌ Groq API key: Missing"
    echo ""
    echo "🔑 To get your Groq API key:"
    echo "1. Visit: https://console.groq.com/keys"
    echo "2. Sign up/login with GitHub or Google"
    echo "3. Create a new API key"
    echo "4. Add it to your .env.local file:"
    echo "   GROQ_API_KEY=your_key_here"
fi

echo ""
echo "🧪 Testing AI providers..."

# Test the API endpoint
if command -v curl &> /dev/null; then
    echo "Making test request..."
    curl -s http://localhost:3000/api/ai/test | jq '.' 2>/dev/null || echo "Server not running or jq not installed"
else
    echo "curl not found - skipping test"
fi

echo ""
echo "📚 Provider Information:"
echo "• Gemini: 15 requests/minute (Google's free tier)"
echo "• OpenRouter: 20 requests/minute (Free models)"
echo "• Groq: 30 requests/minute (Fastest, highest limit)"
echo ""
echo "🔄 Fallback order: Groq → OpenRouter → Gemini"
echo "💾 Responses cached for 5 minutes"
echo ""
echo "✨ Setup complete! Your app now has robust AI fallbacks."
