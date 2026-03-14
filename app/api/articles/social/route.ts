import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateSocialMedia } from "@/lib/ai-providers";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import type { SocialMediaData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // Check usage limits
    const db = adminDb();
    const usageCheck = await canPerformAction(db, uid, 'socialGeneration');
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: usageCheck.reason || "Social media generation limit reached",
          upgradeRequired: true,
          current: usageCheck.current,
          limit: usageCheck.limit
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing articleId" },
        { status: 400 }
      );
    }

    const articleRef = db.collection("articles").doc(articleId);
    const articleSnap = await articleRef.get();

    if (!articleSnap.exists) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const articleData = articleSnap.data() as {
      ownerId?: string;
      keyword?: string;
      draft?: { content?: string };
      settings?: { tone?: string };
    };

    if (articleData.ownerId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!articleData.draft?.content || !articleData.keyword) {
      return NextResponse.json(
        { error: "Article must have draft content and keyword" },
        { status: 400 }
      );
    }

    // Generate social media content
    const socialMediaData = await generateSocialMedia({
      content: articleData.draft.content,
      keyword: articleData.keyword,
      tone: articleData.settings?.tone || "professional",
    });

    // Save to Firestore
    await articleRef.update({
      socialMedia: socialMediaData,
      updatedAt: new Date(),
    });

    // Increment usage counter
    await incrementUsage(db, uid, 'socialGeneration');

    return NextResponse.json(socialMediaData);
  } catch (error) {
    console.error("Social media generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate social media content" },
      { status: 500 }
    );
  }
}
