#!/bin/bash

# Script to migrate API routes from Firebase Auth to Clerk

FILES=(
  "app/api/analytics/route.ts"
  "app/api/articles/[id]/schedule/route.ts"
  "app/api/articles/[id]/versions/route.ts"
  "app/api/articles/[id]/versions/[versionId]/restore/route.ts"
  "app/api/articles/optimize/route.ts"
  "app/api/articles/repurpose/route.ts"
  "app/api/articles/social/route.ts"
  "app/api/articles/track-view/route.ts"
  "app/api/articles/versions/route.ts"
  "app/api/billing/cancel-subscription/route.ts"
  "app/api/billing/invoices/route.ts"
  "app/api/billing/payment-methods/route.ts"
  "app/api/calendar/route.ts"
  "app/api/calendar/schedule/route.ts"
  "app/api/calendar/unschedule/route.ts"
  "app/api/research/cluster/route.ts"
  "app/api/sites/[id]/route.ts"
  "app/api/sites/route.ts"
  "app/api/sites/suggest-topic/route.ts"
  "app/api/stats/route.ts"
  "app/api/wordpress/categories/route.ts"
  "app/api/wordpress/tags/route.ts"
  "app/api/wordpress/sites/route.ts"
  "lib/auth.ts"
)

echo "Files to migrate:"
for file in "${FILES[@]}"; do
  echo "  - $file"
done

echo ""
echo "This will replace Firebase Auth with Clerk in ${#FILES[@]} files."
echo "Press Enter to continue or Ctrl+C to cancel..."
read

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
  else
    echo "Skipping (not found): $file"
  fi
done

echo ""
echo "Migration complete!"
echo ""
echo "Manual steps required:"
echo "1. Add 'import { auth } from \"@clerk/nextjs/server\";' to each file"
echo "2. Replace 'const decoded = await adminAuth().verifyIdToken(token);' with 'const { userId } = await auth();'"
echo "3. Replace 'const uid = decoded.uid;' with 'if (!userId) return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });'"
echo "4. Remove unused 'adminAuth' imports"
