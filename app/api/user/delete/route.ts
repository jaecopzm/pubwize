import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = adminAuth();
    const db = adminDb();

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Delete user data from Firestore
    const batch = db.batch();
    
    // Delete user document
    batch.delete(db.collection("users").doc(uid));
    
    // Delete all articles
    const articlesSnapshot = await db.collection("articles").where("userId", "==", uid).get();
    articlesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all sites
    const sitesSnapshot = await db.collection("sites").where("userId", "==", uid).get();
    sitesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all WordPress sites
    const wpSitesSnapshot = await db.collection("wordpressSites").where("userId", "==", uid).get();
    wpSitesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();

    // Delete Firebase Auth user
    await auth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
