# How to Run the RLS Fix

## The Clean Script
**File:** `/app/RLS_FIX_CLEAN.sql`

This script has **NO ESCAPED QUOTES** and will run without syntax errors.

## Steps to Apply

### 1. Open the File
On your local machine, navigate to:
```
E:\My Programming Projects\DudeMensWear\dudemw\RLS_FIX_CLEAN.sql
```

### 2. Copy the Contents
- Open the file in a text editor
- Select ALL content (Ctrl+A)
- Copy it (Ctrl+C)

### 3. Run in Supabase
1. Open your browser
2. Go to **Supabase Dashboard**
3. Click **SQL Editor** in the left sidebar
4. Create a new query
5. Paste the copied SQL (Ctrl+V)
6. Click **Run** button

### 4. Verify Success
You should see messages like:
- "DROP POLICY" (multiple times)
- "CREATE POLICY" (multiple times)
- "CREATE OR REPLACE FUNCTION" (2 times)

### 5. Test the Functions
In a new SQL Editor query, run:
```sql
SELECT is_storage_admin();
```

**Expected result:** `true` (if you're logged in as super_admin)

### 6. Clear Session
1. Log out from admin dashboard
2. Close ALL browser tabs
3. Clear browser cache (Ctrl+Shift+Delete)
4. Open fresh browser
5. Log back in

### 7. Test Upload
1. Visit `/admin/auth-debug`
2. Should now show your admin profile
3. Click "Test Upload" button
4. Try uploading real images

## What This Fixes

✅ Removes infinite recursion in admin_profiles policies  
✅ Creates SECURITY DEFINER functions to bypass RLS  
✅ Fixes storage policies for all buckets  
✅ Allows super_admin to upload images

## If You Still Get Errors

Share the exact error message and I'll help debug further!
