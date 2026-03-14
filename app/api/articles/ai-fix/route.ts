import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateAIStream } from '@/lib/ai-providers';
import { withErrorHandler, assertValid } from '@/lib/error-handler';
import { authenticateRequest, checkRateLimit, validateRequestBody } from '@/lib/api-security';
import { validateArticleId, validateContent, validateKeyword } from '@/lib/validation';
import { canPerformAction, incrementUsage } from '@/lib/usage-tracking';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Check usage limits
  const db = adminDb();
  const usageCheck = await canPerformAction(db, uid, 'aiImprovements');
  
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { 
        error: usageCheck.reason || "AI improvement limit reached",
        upgradeRequired: true,
        current: usageCheck.current,
        limit: usageCheck.limit
      },
      { status: 403 }
    );
  }

  // 3. Rate limit (30 req/min for AI operations)
  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 4. Validate request body
  const body = await req.json();
  const validation = validateRequestBody(body, ['articleId', 'content', 'suggestion'], ['keyword']);
  assertValid(validation.valid, validation.error || 'Invalid request');

  const { articleId, content, suggestion, keyword } = body;

  // 4. Validate inputs
  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || 'Invalid content');

  if (keyword) {
    const keywordValidation = validateKeyword(keyword);
    assertValid(keywordValidation.valid, keywordValidation.error || 'Invalid keyword');
  }

  // 5. Verify article ownership
  const articleRef = db.collection('articles').doc(articleId);
  const articleDoc = await articleRef.get();

  assertValid(articleDoc.exists, 'Article not found');

  const article = articleDoc.data();
  assertValid(article?.ownerId === uid, 'You don\'t have permission to access this article');

  // 6. Stream AI fixes using Groq
  const systemPrompt = `You are an SEO expert. Your job is to fix content based on specific SEO suggestions.

Requirements:
- Apply ALL the fixes needed for the suggestions provided
- Maintain the original markdown formatting and structure
- Keep the same tone and style
- Make targeted improvements to address each suggestion

Return ONLY the improved content with all fixes applied. No explanations.`;

  const userPrompt = `Suggestions to fix:
${suggestion}
${keyword ? `\nTarget Keyword: ${keyword}` : ""}

Current Content:
${content}

Fix this content based on the suggestions above.`;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let fixedContent = "";

  (async () => {
    try {
      const generator = generateAIStream({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 8000,
        taskType: 'draft', // Use Groq for fast streaming
      });

      for await (const chunk of generator) {
        fixedContent += chunk;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

      // Update the article with fixed content
      await articleRef.update({
        'draft.content': fixedContent,
        updatedAt: new Date(),
      });

      // Increment usage counter
      await incrementUsage(db, uid, 'aiImprovements');

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
    } catch (err) {
      console.error('AI fix streaming failed:', err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "Failed to apply fixes. Please try again." })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
});