#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'app/api/analytics/route.ts',
  'app/api/articles/[id]/schedule/route.ts',
  'app/api/articles/[id]/versions/route.ts',
  'app/api/articles/[id]/versions/[versionId]/restore/route.ts',
  'app/api/articles/optimize/route.ts',
  'app/api/articles/repurpose/route.ts',
  'app/api/articles/social/route.ts',
  'app/api/articles/track-view/route.ts',
  'app/api/articles/versions/route.ts',
  'app/api/calendar/route.ts',
  'app/api/calendar/schedule/route.ts',
  'app/api/calendar/unschedule/route.ts',
  'app/api/research/cluster/route.ts',
  'app/api/sites/[id]/route.ts',
  'app/api/sites/route.ts',
  'app/api/sites/suggest-topic/route.ts',
  'app/api/wordpress/categories/route.ts',
  'app/api/wordpress/tags/route.ts',
];

files.forEach(file => {
  const filePath = path.join('/home/jaeycop/projects/pubwize', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skip: ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add Clerk import at top if not present
  if (!content.includes('import { auth } from "@clerk/nextjs/server"')) {
    content = 'import { auth } from "@clerk/nextjs/server";\n' + content;
  }
  
  // Remove adminAuth import
  content = content.replace(/import \{ adminAuth, adminDb \}/g, 'import { adminDb }');
  content = content.replace(/import \{ adminAuth \}/g, '');
  
  // Replace auth pattern - handle multiple occurrences
  content = content.replace(
    /const authHeader = req(?:uest)?\.headers\.get\(['"](?:authorization|Authorization)['"]\);?\s*const \[, token\] = authHeader\?\.split\(['" ]['"]?\) \|\| \[\];?\s*(?:if \(!token\) \{[^}]+\}\s*)?const (?:decoded|decodedToken) = await adminAuth\(\)\.verifyIdToken\(token\);?\s*const uid = (?:decoded|decodedToken)\.uid;?/g,
    'const { userId: uid } = await auth();\n    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });'
  );
  
  // Alternative pattern
  content = content.replace(
    /const authHeader = req(?:uest)?\.headers\.get\(['"](?:authorization|Authorization)['"]\);?\s*if \(!authHeader.*?\) \{[^}]+\}\s*const token = authHeader\.substring\(7\);?\s*const (?:decoded|decodedToken) = await adminAuth\(\)\.verifyIdToken\(token\);?\s*const uid = (?:decoded|decodedToken)\.uid;?/gs,
    'const { userId: uid } = await auth();\n    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ ${file}`);
});

console.log('\n✅ Migration complete!');
