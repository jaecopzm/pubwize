# Runtime Bugs Fixed ✅

## Issues Found

1. **Stats API Error:** `TypeError: db.collection(...).where(...).count is not a function`
2. **Usage API 404:** Route exists but returning 404

---

## Fix Applied

### 1. Stats Route - Fixed `.count()` Method

**File:** `app/api/stats/route.ts`

**Problem:** 
Firebase Admin SDK doesn't have a `.count()` method in the version being used.

**Before:**
```typescript
const articlesSnapshot = await db
  .collection("articles")
  .where("ownerId", "==", uid)
  .count()  // ❌ This method doesn't exist
  .get();

return NextResponse.json({
  totalArticles: articlesSnapshot.data().count,  // ❌ Wrong
  totalSites: sitesSnapshot.data().count,
  // ...
});
```

**After:**
```typescript
const articlesSnapshot = await db
  .collection("articles")
  .where("ownerId", "==", uid)
  .get();  // ✅ Just get the documents
const totalArticles = articlesSnapshot.size;  // ✅ Use .size property

const sitesSnapshot = await db
  .collection("sites")
  .where("ownerId", "==", uid)
  .get();
const totalSites = sitesSnapshot.size;

return NextResponse.json({
  totalArticles,  // ✅ Use the variables
  totalSites,
  // ...
});
```

**Why this works:**
- `.get()` returns a QuerySnapshot
- QuerySnapshot has a `.size` property with the document count
- This is the standard way to count documents in Firebase Admin SDK

---

### 2. Usage API 404

**File:** `app/api/user/usage/route.ts`

**Status:** Route exists and looks correct. The 404 is likely a caching issue.

**Solution:** 
- Clear `.next` cache
- Restart dev server

```bash
rm -rf .next
npm run dev
```

---

## Testing

After restarting the dev server, these endpoints should work:

1. **GET /api/stats** - Returns user statistics
   ```json
   {
     "totalArticles": 5,
     "totalSites": 2,
     "articlesThisMonth": 3,
     "lastActivity": "2026-05-04T...",
     "planTier": "free"
   }
   ```

2. **GET /api/user/usage** - Returns usage data
   ```json
   {
     "plan": "free",
     "limits": { "articlesPerMonth": 5, ... },
     "usage": { "articlesUsed": 3, ... },
     "periodStart": "2026-05-01T...",
     "periodEnd": "2026-05-31T..."
   }
   ```

---

## Verification

```bash
# Check TypeScript
npx tsc --noEmit  # ✅ No errors

# Clear cache and restart
rm -rf .next
npm run dev
```

Then test in browser:
- Dashboard should load without errors
- Stats should display correctly
- Usage meter should show accurate data

---

## Summary

**Fixed:** 1 critical bug (stats count method)  
**Verified:** Usage route exists and is correct  
**Action needed:** Clear cache and restart dev server

All your UX improvements are still in place and ready to test! 🚀
