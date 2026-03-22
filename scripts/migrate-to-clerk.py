#!/usr/bin/env python3
"""
Migrate API routes from Firebase Auth to Clerk
This script properly handles the auth pattern replacement
"""

import re
import os
from pathlib import Path

# Files that need migration (already using authenticateRequest are skipped)
FILES_TO_MIGRATE = [
    "app/api/analytics/route.ts",
    "app/api/articles/[id]/schedule/route.ts",
    "app/api/articles/[id]/versions/route.ts",
    "app/api/articles/[id]/versions/[versionId]/restore/route.ts",
    "app/api/articles/optimize/route.ts",
    "app/api/articles/repurpose/route.ts",
    "app/api/articles/social/route.ts",
    "app/api/articles/track-view/route.ts",
    "app/api/articles/versions/route.ts",
    "app/api/calendar/route.ts",
    "app/api/calendar/schedule/route.ts",
    "app/api/calendar/unschedule/route.ts",
    "app/api/research/cluster/route.ts",
    "app/api/sites/[id]/route.ts",
    "app/api/sites/route.ts",
    "app/api/sites/suggest-topic/route.ts",
    "app/api/wordpress/categories/route.ts",
    "app/api/wordpress/tags/route.ts",
]

BASE_DIR = Path("/home/jaeycop/projects/pubwize")

def migrate_file(filepath):
    """Migrate a single file from Firebase Auth to Clerk"""
    full_path = BASE_DIR / filepath
    
    if not full_path.exists():
        print(f"⚠️  Skip: {filepath} (not found)")
        return False
    
    with open(full_path, 'r') as f:
        content = f.read()
    
    # Skip if already using Clerk
    if 'import { auth } from "@clerk/nextjs/server"' in content:
        print(f"✓ Skip: {filepath} (already migrated)")
        return False
    
    # Add Clerk import at the top
    if 'import { auth } from "@clerk/nextjs/server"' not in content:
        # Find the first import statement
        first_import = re.search(r'^import ', content, re.MULTILINE)
        if first_import:
            pos = first_import.start()
            content = content[:pos] + 'import { auth } from "@clerk/nextjs/server";\n' + content[pos:]
    
    # Remove adminAuth from imports
    content = re.sub(
        r'import \{ adminAuth, adminDb \}',
        'import { adminDb }',
        content
    )
    content = re.sub(
        r'import \{ adminAuth \}[^\n]*\n',
        '',
        content
    )
    
    # Replacement text
    replacement = '''const { userId: uid } = await auth();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }'''
    
    # Pattern 1: Standard Firebase auth pattern with multiple variations
    patterns = [
        # Pattern with [, token] destructuring
        (re.compile(
            r'const authHeader = req(?:uest)?\.headers\.get\([\'"](?:authorization|Authorization)[\'"]\);?\s*'
            r'const \[, token\] = authHeader\?\.split\([\'"] [\'"]\) \|\| \[\];?\s*'
            r'(?:if \(!token\) \{[^}]+\}\s*)?'
            r'const (?:decoded|decodedToken) = await adminAuth\(\)\.verifyIdToken\(token\);?\s*'
            r'const uid = (?:decoded|decodedToken)\.uid;?',
            re.DOTALL
        ), replacement),
        
        # Pattern with substring(7)
        (re.compile(
            r'const authHeader = req(?:uest)?\.headers\.get\([\'"](?:authorization|Authorization)[\'"]\);?\s*'
            r'if \(!authHeader[^\)]*\) \{[^}]+\}\s*'
            r'const token = authHeader\.substring\(7\);?\s*'
            r'const (?:decoded|decodedToken) = await adminAuth\(\)\.verifyIdToken\(token\);?\s*'
            r'const uid = (?:decoded|decodedToken)\.uid;?',
            re.DOTALL
        ), replacement),
        
        # Simple pattern (just the core auth lines)
        (re.compile(
            r'const (?:decoded|decodedToken) = await adminAuth\(\)\.verifyIdToken\(token\);?\s*'
            r'const uid = (?:decoded|decodedToken)\.uid;?',
            re.DOTALL
        ), '''const { userId: uid } = await auth();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }'''),
    ]
    
    for pattern, repl in patterns:
        content = pattern.sub(repl, content)
    
    # Write back
    with open(full_path, 'w') as f:
        f.write(content)
    
    print(f"✅ {filepath}")
    return True

def main():
    print("🔄 Migrating API routes to Clerk...\n")
    
    migrated = 0
    for filepath in FILES_TO_MIGRATE:
        if migrate_file(filepath):
            migrated += 1
    
    print(f"\n✅ Migration complete! Migrated {migrated} files.")
    print("\nNext steps:")
    print("1. Clear .next cache: rm -rf .next")
    print("2. Restart dev server")

if __name__ == "__main__":
    main()
