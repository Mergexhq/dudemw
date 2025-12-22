# 🔄 Infinite Recursion Fix Guide

## 🎯 Problem Summary

**Error**: `infinite recursion detected in policy for relation "admin_profiles"`

### What Happened?

1. ✅ You're logged in as a super admin
2. ✅ Your role is stored in `admin_profiles` table
3. ❌ Storage RLS policies try to check `admin_profiles`
4. ❌ But `admin_profiles` has its own RLS policies
5. ❌ Those policies also check `admin_profiles`
6. 💥 **Infinite recursion loop!**

### The Recursion Chain

```
Storage Upload Attempt
  ↓
Storage RLS: Check admin_profiles table
  ↓
admin_profiles RLS: Check admin_profiles table (recursion!)
  ↓
admin_profiles RLS: Check admin_profiles table (recursion!)
  ↓
admin_profiles RLS: Check admin_profiles table (recursion!)
  ↓
💥 STACK OVERFLOW - Supabase kills the query
```

## 🛠️ The Solution

Use a **SECURITY DEFINER** function that bypasses RLS when checking admin status.

### Why This Works

- `SECURITY DEFINER` functions run with the privileges of the function owner (not the caller)
- They can bypass RLS policies on tables
- But they're **safe** because they only return a boolean (no data leakage)
- They break the recursion chain

### The Safe Function

```sql
CREATE OR REPLACE FUNCTION is_storage_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Direct query bypasses RLS
    SELECT EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    ) INTO admin_exists;
    
    RETURN COALESCE(admin_exists, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Step-by-Step Fix

### Step 1: Run the SQL Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `/app/FIX_INFINITE_RECURSION_STORAGE_RLS.sql`
3. Paste and click **Run**
4. Wait for success message

### Step 2: Verify Function Creation

In SQL Editor, run:

```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_name = 'is_storage_admin';
```

**Expected Result:**
```
routine_name      | routine_type | security_type
------------------|--------------|--------------
is_storage_admin  | FUNCTION     | DEFINER
```

### Step 3: Verify Storage Policies

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%categories%';
```

**Expected**: Policies should reference `is_storage_admin()` function, NOT direct `admin_profiles` queries.

### Step 4: Clear Your Session

1. **Log out** of admin dashboard
2. **Close all browser tabs**
3. **Clear browser cache** (Ctrl+Shift+Delete)
4. **Restart browser** (optional but recommended)

### Step 5: Log Back In

1. Visit your admin login page
2. Enter credentials
3. You should be logged in successfully

### Step 6: Test Image Upload

1. Go to **Categories** or **Products** page
2. Try uploading an image
3. **Expected**: ✅ Upload succeeds without errors!

## 🧪 Testing & Verification

### Test 1: Check Admin Status

While logged in, run in SQL Editor:

```sql
SELECT is_storage_admin();
```

**Expected Result**: `true` (if you're an active admin)

### Test 2: Check Upload Permissions

```sql
SELECT 
    auth.uid() as current_user_id,
    is_storage_admin() as can_upload,
    (SELECT role FROM admin_profiles WHERE user_id = auth.uid()) as role,
    (SELECT is_active FROM admin_profiles WHERE user_id = auth.uid()) as is_active;
```

**Expected Result**:
```
current_user_id              | can_upload | role        | is_active
-----------------------------+------------+-------------+-----------
[your-uuid]                  | true       | super_admin | true
```

### Test 3: Upload Test Files

Try uploading to different buckets:

- ✅ **Categories**: Small image (< 5MB)
- ✅ **Product Images**: Medium image (< 10MB)
- ✅ **Avatars**: Profile picture
- ✅ **Banners**: Banner image

## 🔍 Troubleshooting

### Still Getting Recursion Error?

**Possible Causes:**

1. **Script didn't run completely**
   - Re-run the entire script
   - Check for error messages

2. **Old policies still exist**
   ```sql
   -- List all storage policies
   SELECT policyname, definition 
   FROM pg_policies 
   WHERE schemaname = 'storage' 
   AND tablename = 'objects';
   ```
   - If any policy contains `SELECT 1 FROM admin_profiles`, it needs to be updated

3. **Function not created properly**
   ```sql
   -- Check function details
   SELECT proname, prosecdef 
   FROM pg_proc 
   WHERE proname = 'is_storage_admin';
   ```
   - `prosecdef` should be `true` (means SECURITY DEFINER)

4. **Session not refreshed**
   - Make sure you logged out AND cleared cache
   - Try incognito/private window

### Different Error Message?

If you see:

- **"permission denied"**: Check that you're logged in as an active admin
- **"bucket not found"**: Run storage bucket creation scripts first
- **"file too large"**: Check bucket size limits
- **"invalid mime type"**: Check allowed file types for the bucket

## 📊 What Changed?

### Before (Broken)

```sql
-- ❌ Storage policy directly querying admin_profiles
CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM admin_profiles  -- This triggers RLS on admin_profiles
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);
```

### After (Fixed)

```sql
-- ✅ Storage policy using SECURITY DEFINER function
CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'categories' 
  AND is_storage_admin()  -- This bypasses RLS
);
```

## 🎓 Understanding SECURITY DEFINER

### What It Does

- Function runs with **creator's privileges** (usually superuser)
- Can **bypass RLS policies** on tables
- Useful for **trusted operations** that need elevated access

### Why It's Safe Here

1. **No data leakage**: Only returns boolean (true/false)
2. **No parameters**: Can't be exploited with malicious input
3. **Clear purpose**: Only checks if user is admin
4. **Auditable**: Simple logic, easy to review

### When to Use

✅ **Good Uses:**
- Checking permissions (like our case)
- Counting records
- Validating business rules
- Audit logging

❌ **Bad Uses:**
- Returning sensitive data
- Complex business logic
- User-controllable queries

## 📚 Additional Resources

### Supabase Documentation

- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [SECURITY DEFINER Functions](https://supabase.com/docs/guides/database/functions)

### PostgreSQL Documentation

- [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

## ✅ Success Checklist

- [ ] SQL script executed successfully
- [ ] `is_storage_admin()` function created
- [ ] Storage policies updated
- [ ] Logged out and cleared cache
- [ ] Logged back in successfully
- [ ] Image upload works for categories
- [ ] Image upload works for products
- [ ] No recursion errors in console
- [ ] Debug page shows correct admin status

## 🎉 Summary

**Problem**: RLS policies creating infinite recursion  
**Solution**: SECURITY DEFINER function to break the loop  
**Result**: Image uploads work perfectly!

The fix is **permanent** and **production-ready**. No further action needed once applied.

---

**Questions or Issues?**  
Check the troubleshooting section or review Supabase logs in the dashboard.
