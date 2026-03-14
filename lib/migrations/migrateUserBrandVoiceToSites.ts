/*
One-time migration helper to copy the old "brandVoice" object from
user documents into each of the sites they own.  After running this
and verifying results you can safely delete the `brandVoice` field from
users (optional).

Usage:
  node -r ts-node/register lib/migrations/migrateUserBrandVoiceToSites.ts

Be sure to run against a firestore emulator or backup before touching
production data.
*/

import { adminDb } from "@/lib/firebase-admin";

async function main() {
    const db = adminDb();
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users`);

    for (const userDoc of usersSnap.docs) {
        const userData: any = userDoc.data();
        const voice = userData.brandVoice;
        if (!voice) continue;

        const sitesSnap = await db.collection('sites').where('ownerId', '==', userDoc.id).get();
        if (sitesSnap.empty) continue;

        for (const siteDoc of sitesSnap.docs) {
            const siteData: any = siteDoc.data();
            // if site already has a brandVoice with adjectives, skip
            if (siteData.brandVoice && siteData.brandVoice.adjectives && siteData.brandVoice.adjectives.length) {
                continue;
            }
            const update: any = {
                'brandVoice.tone': voice.tone || '',
                'brandVoice.targetAudience': voice.targetAudience || '',
                'brandVoice.formattingRules': voice.formattingRules || '',
            };
            await siteDoc.ref.update(update);
            console.log(`Updated site ${siteDoc.id} for user ${userDoc.id}`);
        }

        // optional: remove the user-level field
        // await userDoc.ref.update({ brandVoice: adminDb.FieldValue.delete() });
    }

    console.log('Migration complete');
}

main().catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
});
