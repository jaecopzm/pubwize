import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { withErrorHandler } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";

function calculateWordCount(content: string): number {
  if (!content) return 0;
  
  return content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/[#*_~\[\](){}]/g, '') // Remove markdown chars
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const db = adminDb();
  const articlesSnapshot = await db
    .collection("articles")
    .where("ownerId", "==", auth.uid)
    .get();

  let updated = 0;
  const batch = db.batch();

  for (const doc of articlesSnapshot.docs) {
    const data = doc.data();
    let wordCount = 0;

    // Calculate word count from draft content
    if (data.draft?.content) {
      wordCount = calculateWordCount(data.draft.content);
    }
    // Or from outline if no draft
    else if (data.outline?.sections) {
      const outlineText = data.outline.sections
        .map((section: any) => `${section.title} ${section.content || ''}`)
        .join(' ');
      wordCount = calculateWordCount(outlineText);
    }

    // Update if word count is different or missing
    if (data.wordCount !== wordCount) {
      batch.update(doc.ref, { wordCount });
      updated++;
    }
  }

  if (updated > 0) {
    await batch.commit();
  }

  return NextResponse.json({ 
    message: `Updated word count for ${updated} articles`,
    updated 
  });
});
