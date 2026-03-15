# Abuse Prevention System

## Overview

Prevents users from deleting their free account and recreating it to bypass the 5 articles/month limit.

## How It Works

### 1. Account Creation Checks

When a user signs up, the system checks:

- **Email Domain Limit**: Max 3 free accounts per email domain in 30 days
  - Prevents: `user1@gmail.com`, `user2@gmail.com`, `user3@gmail.com` abuse
  - Allows: Legitimate users with different email providers

- **IP Address Limit**: Max 5 free accounts per IP in 30 days
  - Prevents: Same person creating multiple accounts
  - Allows: Shared networks (offices, cafes) with reasonable limits

- **Recently Deleted Check**: Blocks re-signup for 30 days after deletion
  - Prevents: Delete → Recreate loop
  - Message: "Account recently deleted. Please wait X days or contact support to restore."

### 2. Account Deletion Tracking

When a user deletes their account:
- Record is saved to `deleted_accounts` collection
- Stores: email, emailDomain, signupIp, plan, articlesCreated, deletedAt
- Expires after 90 days (auto-cleanup via cron)

### 3. Data Stored

**users collection** (new fields):
```typescript
{
  emailDomain: string,  // e.g., "gmail.com"
  signupIp: string,     // e.g., "192.168.1.1"
  // ... existing fields
}
```

**deleted_accounts collection**:
```typescript
{
  userId: string,
  email: string,
  emailDomain: string,
  signupIp: string,
  plan: string,
  articlesCreated: number,
  deletedAt: Timestamp,
  expiresAt: Timestamp  // 90 days after deletion
}
```

## Configuration

### Environment Variables

Add to `.env.local`:
```bash
CRON_SECRET=your-random-secret-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Firestore Indexes

Required indexes (see `FIRESTORE_INDEXES.md`):
1. users: emailDomain + plan + createdAt
2. users: signupIp + plan + createdAt
3. deleted_accounts: email + deletedAt
4. deleted_accounts: expiresAt

### Cron Jobs

**Cleanup Job** (runs daily at 2 AM):
- Path: `/api/cron/cleanup-deleted-accounts`
- Deletes records older than 90 days
- Configured in `vercel.json`

## Limits & Thresholds

| Check | Limit | Time Window | Adjustable In |
|-------|-------|-------------|---------------|
| Email Domain | 3 accounts | 30 days | `lib/abuse-prevention.ts` line 23 |
| IP Address | 5 accounts | 30 days | `lib/abuse-prevention.ts` line 35 |
| Re-signup Block | 1 account | 30 days | `lib/abuse-prevention.ts` line 47 |
| Record Retention | - | 90 days | `lib/abuse-prevention.ts` line 71 |

## Adjusting Limits

Edit `/lib/abuse-prevention.ts`:

```typescript
// More strict (2 accounts per domain)
if (domainQuery.data().count >= 2) { ... }

// More lenient (10 accounts per IP)
if (ipQuery.data().count >= 10) { ... }

// Longer block period (60 days)
const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
```

## Bypasses & Exceptions

### Whitelist Business Domains

Edit `/lib/abuse-prevention.ts`:

```typescript
const businessDomains = [
  'yourcompany.com',
  'partnerdomain.com'
];
```

### Manual Override

Support can manually delete records from `deleted_accounts` collection to allow immediate re-signup.

## User Experience

### Blocked User Messages

1. **Email domain limit**: "Too many accounts from this email domain. Please upgrade or contact support."
2. **IP limit**: "Too many accounts from this location. Please contact support."
3. **Recently deleted**: "Account recently deleted. Please wait 15 days or contact support to restore."

### Support Process

If legitimate user is blocked:
1. Verify identity
2. Delete their record from `deleted_accounts` collection
3. User can immediately re-signup

## Testing

### Test Account Creation Abuse

```bash
# Create 4 accounts with same domain
curl -X POST https://pubwize.com/api/user/plan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test1","email":"test1@testdomain.com"}'

# 4th should be blocked
```

### Test Deletion & Re-signup

```bash
# 1. Create account
# 2. Delete via UI
# 3. Try to re-signup with same email
# Should be blocked for 30 days
```

## Monitoring

### Check Abuse Attempts

```javascript
// Firestore Console
db.collection('deleted_accounts')
  .where('deletedAt', '>', thirtyDaysAgo)
  .orderBy('deletedAt', 'desc')
  .get()
```

### Check Multiple Accounts

```javascript
// Same email domain
db.collection('users')
  .where('emailDomain', '==', 'gmail.com')
  .where('plan', '==', 'free')
  .get()

// Same IP
db.collection('users')
  .where('signupIp', '==', '192.168.1.1')
  .where('plan', '==', 'free')
  .get()
```

## Privacy & GDPR

- IP addresses are hashed (optional enhancement)
- Data is automatically deleted after 90 days
- Users can request immediate deletion via support
- Complies with "right to be forgotten" (with 30-day fraud prevention window)

## Future Enhancements

1. **Device Fingerprinting**: Use browser fingerprinting library
2. **Phone Verification**: Require SMS verification for free tier
3. **Credit Card Verification**: $0 authorization hold
4. **Machine Learning**: Detect patterns in abuse attempts
5. **Graduated Limits**: Increase limits for verified users

## Cost Impact

- Minimal: ~100 extra Firestore reads per signup
- Negligible: Small documents in deleted_accounts collection
- Benefit: Prevents unlimited free usage abuse
