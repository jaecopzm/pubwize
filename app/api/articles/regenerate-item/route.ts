import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-providers";
import { adminDb } from "@/lib/firebase-admin";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(async (req: NextRequest) => {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    assertValid(auth.success, auth.error || "Authentication failed");
    const uid = auth.uid!;

    // 2. Check usage quota
    const db = adminDb();
    const usageCheck = await canPerformAction(db, uid, "sectionRegenerations");

    if (!usageCheck.allowed) {
        throw new QuotaExceededError(
            usageCheck.reason || "Regeneration limit reached",
            usageCheck.current || 0,
            usageCheck.limit || 0,
            "sectionRegenerations"
        );
    }

    // 3. Validate request body
    const body = await req.json();
    const validation = validateRequestBody(body, ["type", "originalValue", "keyword"]);
    assertValid(validation.valid, validation.error || "Invalid request");

    const { type, originalValue, keyword, context } = body;

    // 4. Build prompts based on type
    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'heading') {
        systemPrompt = `You are an SEO expert. Generate a single, highly engaging, and SEO-optimized heading (H2) for an article about the given keyword.
The heading should be better than the original one provided.
Return ONLY the heading text, no quotes or additional formatting.`;
        userPrompt = `Keyword: "${keyword}"\nOriginal Heading: "${originalValue}"${context ? `\nContext: ${context}` : ''}`;
    } else if (type === 'question') {
        systemPrompt = `You are an SEO expert. Generate a single "People Also Ask" type question related to the given keyword.
The question should be practical, search-relevant, and engaging.
Return ONLY the question text, no quotes or additional formatting.`;
        userPrompt = `Keyword: "${keyword}"\nOriginal Question: "${originalValue}"${context ? `\nContext: ${context}` : ''}`;
    } else {
        assertValid(false, "Invalid item type");
    }

    // 5. Generate new content
    let newValue: string;
    try {
        newValue = await generateAIResponse({
            systemPrompt,
            userPrompt,
            temperature: 0.9,
        });
        // Remove quotes if any
        newValue = newValue.replace(/^["']|["']$/g, '');
    } catch (aiError) {
        console.error("Item regeneration failed:", aiError);
        throw new ExternalServiceError("AI regeneration service", aiError);
    }

    // 6. Increment usage counter
    await incrementUsage(db, uid, "sectionRegenerations");

    // 7. Return success
    return NextResponse.json({ newValue });
});
