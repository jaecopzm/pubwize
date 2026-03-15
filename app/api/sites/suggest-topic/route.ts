import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { siteId } = await req.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });
    }

    const db = adminDb();

    // Get user plan
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const plan = userData?.plan || userData?.planTier || 'free';

    // Only Pro users can get AI suggestions
    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
    }

    // Get site details
    const siteDoc = await db.collection('sites').doc(siteId).get();
    if (!siteDoc.exists || siteDoc.data()?.ownerId !== uid) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const site = siteDoc.data();

    // Get existing articles for this site
    const articlesSnapshot = await db
      .collection('articles')
      .where('siteId', '==', siteId)
      .where('ownerId', '==', uid)
      .limit(10)
      .get();

    const existingTopics = articlesSnapshot.docs.map(doc => doc.data().keyword);

    // Generate topic suggestion
    const prompt = `You are an SEO content strategist. Based on the following information, suggest ONE specific, actionable article topic that would complement the existing content.

Site Niche: ${site.niche}
Target Country: ${site.targetCountry || 'Global'}
Existing Topics: ${existingTopics.length > 0 ? existingTopics.join(', ') : 'None yet'}

Requirements:
- Must be relevant to the niche
- Should NOT duplicate existing topics
- Should be trending or evergreen
- Must be specific (not generic)
- Should target search intent
- Keep it under 60 characters

Return ONLY the topic title, nothing else.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();
    const cleanTopic = suggestion.trim().replace(/^["']|["']$/g, '');

    return NextResponse.json({ topic: cleanTopic });
  } catch (error) {
    console.error('Topic suggestion error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
