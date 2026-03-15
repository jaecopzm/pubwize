# Firestore Indexes for Abuse Prevention

## Required Composite Indexes

Add these to your Firebase Console under Firestore > Indexes:

### 1. Users - Email Domain + Plan + Created At
Collection: `users`
Fields:
- emailDomain (Ascending)
- plan (Ascending)  
- createdAt (Descending)

### 2. Users - Signup IP + Plan + Created At
Collection: `users`
Fields:
- signupIp (Ascending)
- plan (Ascending)
- createdAt (Descending)

### 3. Deleted Accounts - Email + Deleted At
Collection: `deleted_accounts`
Fields:
- email (Ascending)
- deletedAt (Descending)

### 4. Deleted Accounts - Expires At (for cleanup)
Collection: `deleted_accounts`
Fields:
- expiresAt (Ascending)

## How to Create

1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Create Index"
3. Add the fields as specified above
4. Wait for index to build (usually 1-5 minutes)

## Alternative: Auto-create via Error Messages

You can also trigger the queries and Firebase will provide direct links to create the indexes in the error messages.
