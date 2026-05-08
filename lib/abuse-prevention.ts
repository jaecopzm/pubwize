import { prisma } from "@/lib/prisma";

interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkAccountCreationAbuse(
  email: string,
  ipAddress?: string
): Promise<AbuseCheckResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const emailDomain = email.split("@")[1]?.toLowerCase();
  const businessDomains = ["company.com"];
  if (businessDomains.includes(emailDomain)) return { allowed: true };

  // Check 1: Email domain abuse (max 3 free accounts per domain in 30 days)
  const domainCount = await prisma.user.count({
    where: { email: { endsWith: `@${emailDomain}` }, planTier: "free", createdAt: { gt: thirtyDaysAgo } },
  });

  if (domainCount >= 3) {
    return { allowed: false, reason: "Too many accounts from this email domain. Please upgrade or contact support." };
  }

  // Check 2: IP address abuse (max 5 free accounts per IP in 30 days)
  // Note: signupIp not in schema yet, skip for now

  // Check 3: Recently deleted account - not implemented yet
  return { allowed: true };
}

export async function trackAccountDeletion(userId: string, email: string) {
  // Not implemented yet - no deleted_accounts table in Prisma schema
}
