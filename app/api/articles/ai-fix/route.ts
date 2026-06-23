import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";

import { generateAIStream, aiUserContext } from '@/lib/ai-providers';
import { withErrorHandler, assertValid } from '@/lib/error-handler';
import { authenticateRequest, validateRequestBody } from '@/lib/api-security';
import { checkRateLimitByIdentifier } from '@/lib/rate-limit';
import { validateArticleId, validateContent, validateKeyword } from '@/lib/validation';
import { canPerformAction, incrementUsage } from '@/lib/usage-tracking';
import { invalidateArticleCache } from '@/lib/cache-invalidation';
import { asDraft } from '@/lib/prisma-json';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || 'Authentication failed');
  const uid = auth.uid!;

  // 2. Check usage limits
  const usageCheck = await canPerformAction(uid, 'aiImprovements');
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

  // 3. Rate limit
  const rateLimit = await checkRateLimitByIdentifier(uid, 30, 60000);
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

  const idValidation = validateArticleId(articleId);
  assertValid(idValidation.valid, idValidation.error || 'Invalid article ID');

  const contentValidation = validateContent(content);
  assertValid(contentValidation.valid, contentValidation.error || 'Invalid content');

  if (keyword) {
    const keywordValidation = validateKeyword(keyword);
    assertValid(keywordValidation.valid, keywordValidation.error || 'Invalid keyword');
  }

  // 5. Verify article ownership
  const { prisma } = await import('@/lib/prisma');
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  assertValid(!!article, 'Article not found');
  assertValid(article!.ownerId === uid, "You don't have permission to access this article");

  // Estimate original word count so we can constrain output length
  const originalWordCount = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_~`\[\](){}]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .split(/\s+/)
    .filter((w: string) => w.length > 0).length;

  // Allow ±15% word count variance — precision edits, not rewrites
  const minWords = Math.floor(originalWordCount * 0.85);
  const maxWords = Math.ceil(originalWordCount * 1.15);

  // 6. Build a surgical, structure-preserving prompt
  const systemPrompt = `You are a surgical SEO editor. Your job is to make TARGETED improvements to existing content based on specific suggestions.

CRITICAL RULES — violate any of these and the output is unusable:
1. PRESERVE STRUCTURE: Keep every heading (##, ###), every section, every list, every blockquote, every markdown element exactly where it is. Do not merge, reorder, or delete any sections.
2. PRESERVE WORD COUNT: The original content is approximately ${originalWordCount} words. Your output must be ${minWords}–${maxWords} words. Do not add padding or cut meaningful content.
3. TARGETED EDITS ONLY: Only change the specific phrases, sentences, or words needed to satisfy each suggestion. Leave everything else word-for-word identical.
4. NO HALLUCINATIONS: Do not invent new facts, statistics, URLs, or brand names that were not in the original.
5. RETURN ONLY MARKDOWN: Return the complete improved article as clean Markdown. No preamble, no "Here's the improved version:", no explanation.`;

  const userPrompt = `SEO suggestions to apply (make ONLY these targeted changes):
${suggestion}
${keyword ? `\nTarget keyword: "${keyword}"` : ''}

Original article (${originalWordCount} words — output must stay within ${minWords}–${maxWords} words):
${content}

Apply the suggestions above with surgical precision. Return the full improved article.`;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let fixedContent = '';

  (async () => {
    try {
      const generator = aiUserContext.run(uid, () => generateAIStream({
        systemPrompt,
        userPrompt,
        temperature: 0.3, // Low temperature = precise, non-hallucinating edits
        maxTokens: Math.min(Math.ceil(originalWordCount * 2.2), 8000),
        taskType: 'draft',
      }));

      for await (const chunk of generator) {
        fixedContent += chunk;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

      // Strip accidental code fences if the model wrapped output
      let normalized = fixedContent.trim();
      if (normalized.startsWith('```markdown')) {
        normalized = normalized.replace(/^```markdown\s*\n/, '').replace(/\n```$/, '').trim();
      } else if (normalized.startsWith('```')) {
        normalized = normalized.replace(/^```[a-zA-Z]*\s*\n/, '').replace(/\n```$/, '').trim();
      }

      // Persist to DB
      const { prisma: db } = await import('@/lib/prisma');
      const existingDraft = asDraft(article?.draft) || {};
      await db.article.update({
        where: { id: articleId },
        data: { draft: { ...existingDraft, content: normalized } },
      });

      await incrementUsage(uid, 'aiImprovements');
      await invalidateArticleCache(articleId, uid);

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, finalContent: normalized })}\n\n`));
    } catch (err) {
      logger.error('AI fix streaming failed', err);
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