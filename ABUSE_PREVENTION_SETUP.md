# Abuse Prevention - Quick Setup

## What Was Implemented

A multi-layered system to prevent users from deleting their free account and recreating it to bypass the 5 articles/month limit.

## Files Created/Modified

### New Files
1. `/lib/abuse-prevention.ts` - Core abuse detection logic
2. `/app/api/cron/cleanup-deleted-accounts/route.ts` - Cleanup cron job
3. `/docs/ABUSE_PREVENTION.md` - Full documentation
4. `/FIRESTORE_INDEXES.md` - Required database indexes

### Modified Files
1. `/app/api/user/plan/route.ts` - Added abuse checks on signup
2. `/app/api/user/delete/route.ts` - Track deletions
3. `/vercel.json` - Added cleanup cron job

## Setup Steps

### 1. Add Environment Variable

Add to your `.env.local` and Vercel environment:

```bash
CRON_SECRET=your-random-secret-here
```

Generate one with:
```bash
openssl rand -base64 32
```

### 2. Create Firestore Indexes

Go to Firebase Console > Firestore > Indexes and create:

1. **users** collection:
   - emailDomain (Ascending) + plan (Ascending) + createdAt (Descending)
   - signupIp (Ascending) + plan (Ascending) + createdAt (Descending)

2. **deleted_accounts** collection:
   - email (Ascending) + deletedAt (Descending)
   - expiresAt (Ascending)

Or just deploy and click the index creation links in the error messages.

### 3. Deploy

```bash
git add .
git commit -m "Add abuse prevention system"
git push
```

## How It Works

### On Signup
- Checks if email domain has >3 free accounts in last 30 days
- Checks if IP address has >5 free accounts in last 30 days
- Checks if this email was recently deleted (blocks for 30 days)
- If any check fails, deletes the Firebase Auth user and returns error

### On Account Deletion
- Saves record to `deleted_accounts` collection
- Includes: email, emailDomain, signupIp, plan, articlesCreated, deletedAt
- Record expires after 90 days (auto-cleaned by cron)

### Daily Cleanup
- Cron job runs at 2 AM daily
- Deletes `deleted_accounts` records older than 90 days

## Limits

| Protection | Limit | Window |
|------------|-------|--------|
| Email domain | 3 accounts | 30 days |
| IP address | 5 accounts | 30 days |
| Re-signup block | Blocked | 30 days |

## Adjusting Limits

Edit `/lib/abuse-prevention.ts`:

```typescript
// Line 23: Email domain limit
if (domainQuery.data().count >= 3) { ... }

// Line 35: IP address limit  
if (ipQuery.data().count >= 5) { ... }

// Line 12: Time window
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
```

## Testing

1. Create 4 accounts with emails from same domain (e.g., test1@gmail.com, test2@gmail.com...)
2. 4th should be blocked with error message
3. Delete an account and try to recreate it immediately
4. Should be blocked for 30 days

## Support Override

If legitimate user is blocked:
1. Go to Firestore Console
2. Find their record in `deleted_accounts` collection
3. Delete the record
4. User can immediately re-signup

## What This Prevents

✅ Delete account → Recreate → Get 5 more free articles  
✅ Create multiple accounts with same email domain  
✅ Create multiple accounts from same IP/location  
✅ Automated abuse scripts  

## What This Allows

✅ Legitimate users with different email providers  
✅ Shared networks (offices, cafes) with reasonable limits  
✅ Users who upgrade to paid plans (no restrictions)  
✅ Account recovery within 30 days via support  

## Cost

- ~100 extra Firestore reads per signup (negligible)
- Small storage for deleted_accounts collection
- Auto-cleanup prevents unbounded growth

## Privacy

- IP addresses stored for fraud prevention (30-90 days)
- Auto-deleted after 90 days
- Can be immediately deleted via support request
- Complies with GDPR "right to be forgotten" (with fraud prevention window)
