import { getFirestore } from 'firebase-admin/firestore';

interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkAccountCreationAbuse(
  email: string,
  ipAddress?: string
): Promise<AbuseCheckResult> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Extract email domain
  const emailDomain = email.split('@')[1]?.toLowerCase();
  
  // Skip checks for business domains (optional whitelist)
  const businessDomains = ['company.com']; // Add your business domains
  if (businessDomains.includes(emailDomain)) {
    return { allowed: true };
  }

  // Check 1: Email domain abuse (max 3 free accounts per domain in 30 days)
  const domainQuery = await db.collection('users')
    .where('emailDomain', '==', emailDomain)
    .where('plan', '==', 'free')
    .where('createdAt', '>', thirtyDaysAgo)
    .count()
    .get();

  if (domainQuery.data().count >= 3) {
    return {
      allowed: false,
      reason: 'Too many accounts from this email domain. Please upgrade or contact support.'
    };
  }

  // Check 2: IP address abuse (max 5 free accounts per IP in 30 days)
  if (ipAddress) {
    const ipQuery = await db.collection('users')
      .where('signupIp', '==', ipAddress)
      .where('plan', '==', 'free')
      .where('createdAt', '>', thirtyDaysAgo)
      .count()
      .get();

    if (ipQuery.data().count >= 5) {
      return {
        allowed: false,
        reason: 'Too many accounts from this location. Please contact support.'
      };
    }
  }

  // Check 3: Recently deleted account with same email
  const deletedQuery = await db.collection('deleted_accounts')
    .where('email', '==', email.toLowerCase())
    .where('deletedAt', '>', thirtyDaysAgo)
    .limit(1)
    .get();

  if (!deletedQuery.empty) {
    const deletedAccount = deletedQuery.docs[0].data();
    const daysRemaining = Math.ceil(
      (30 - (now.getTime() - deletedAccount.deletedAt.toDate().getTime()) / (24 * 60 * 60 * 1000))
    );
    
    return {
      allowed: false,
      reason: `Account recently deleted. Please wait ${daysRemaining} days or contact support to restore.`
    };
  }

  return { allowed: true };
}

export async function trackAccountDeletion(userId: string, email: string) {
  const db = getFirestore();
  
  // Get user data before deletion
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  // Store in deleted_accounts collection
  const deletionRecord: any = {
    userId,
    email: email.toLowerCase(),
    emailDomain: email.split('@')[1]?.toLowerCase(),
    plan: userData?.plan || 'free',
    articlesCreated: userData?.articlesCreated || 0,
    deletedAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Keep for 90 days
  };

  // Only add signupIp if it exists
  if (userData?.signupIp) {
    deletionRecord.signupIp = userData.signupIp;
  }

  await db.collection('deleted_accounts').add(deletionRecord);
}
