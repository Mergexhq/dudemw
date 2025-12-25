# Wishlist RLS Permission Fix Guide

## Problem Summary

You're encountering a PostgreSQL error when accessing the wishlist:
```
Error: permission denied for table users (code: 42501)
```

## Root Cause

The issue occurs because:

1. The wishlist API query joins `wishlist_items` with `products` table
2. The `products` table has RLS (Row Level Security) policies that call `is_admin_user()` function
3. The `is_admin_user()` function tries to query the `auth.users` table
4. Anonymous/guest users don't have direct permission to access `auth.users` table
5. Even though the function has `SECURITY DEFINER`, it wasn't properly configured to bypass RLS

## Solution

The `is_admin_user()` and `is_owner_user()` functions need to be recreated with:
- Proper `SECURITY DEFINER` attribute
- Explicit `search_path` setting to access both `public` and `auth` schemas
- Better error handling for permission issues

## How to Apply the Fix

### Step 1: Access your Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)

### Step 2: Execute the Fix Script

1. Create a new query
2. Copy the entire contents of `/app/fix-wishlist-rls.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute

The script will:
- Drop the existing `is_admin_user()` and `is_owner_user()` functions
- Recreate them with proper `SECURITY DEFINER` and `search_path` settings
- Add better error handling
- Verify the changes

### Step 3: Verify the Fix

After running the script, you should see:
```
status: Functions updated successfully!
details: Both is_admin_user() and is_owner_user() now have proper SECURITY DEFINER and search_path

function_name      | is_security_definer | function_settings
-------------------+---------------------+-----------------------------------
is_admin_user      | t (true)            | {search_path=public,auth}
is_owner_user      | t (true)            | {search_path=public,auth}
```

### Step 4: Test Your Application

1. Refresh your application
2. Try accessing the wishlist page
3. The "permission denied" error should be resolved

## Alternative: Quick Fix via Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Execute the fix script
supabase db execute -f fix-wishlist-rls.sql
```

## What Changed?

### Before:
```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Problem**: Missing `search_path` setting, causing permission errors when accessing `auth.users`

### After:
```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;  -- ← This is the key addition
```
**Solution**: The `SET search_path = public, auth` ensures the function can properly access both the `public` schema (for your tables) and the `auth` schema (for auth.users).

## Verify It Works

Once applied, test with:

1. **As Guest User**: Visit wishlist page - should load without errors
2. **As Logged-in User**: Add items to wishlist - should work correctly
3. **As Admin**: Access admin dashboard - should have full access

## Need Help?

If the issue persists after applying this fix:

1. Check the browser console for any new error messages
2. Check your server logs for database errors
3. Verify the functions were created correctly:
   ```sql
   SELECT proname, prosecdef 
   FROM pg_proc 
   WHERE proname IN ('is_admin_user', 'is_owner_user');
   ```

## Files Modified in This Fix

- `/app/fix-wishlist-rls.sql` - SQL script to fix the RLS functions
- `/app/src/app/api/wishlist/route.ts` - Already fixed (removed `original_price`)

---

**Note**: You only need to run this SQL script once in your Supabase database. It doesn't need to be rerun for each deployment.
