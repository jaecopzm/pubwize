import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OutlineData } from "@/lib/types";
import { generateOutline, aiUserContext } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  assertValid(!!article, "Article not found");
  assertValid(article!.ownerId === uid, "You don't have permission to access this article");
  assertValid(!!article!.brief, "No SEO brief found. Please generate a brief first.");

  let outline: OutlineData;
  try {
    outline = await aiUserContext.run(uid, () =>
      generateOutline({
        brief: article!.brief as any,
        keyword: article!.keyword,
      })
    );
  } catch (err) {
    throw new ExternalServiceError("AI generation service", err);
  }

  await prisma.article.update({
    where: { id: articleId },
    data: { outline: outline as any, status: "outline_generated" },
  });

  return NextResponse.json({ articleId, outline });
});
