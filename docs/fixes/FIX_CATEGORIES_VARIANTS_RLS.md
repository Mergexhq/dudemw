# 🔧 Fix Categories & Product Variants Image Upload RLS Error

## 🐛 Current Problem
You're getting this error when uploading images in Categories and Product Variants:
```
StorageApiError: new row violates row-level security policy
```

## ✅ Your Status
- ✅ Logged in as: mainfordudemw@gmail.com
- ✅ User ID: a703c06b-4739-4c16-8cd6-dd181eb677f9
- ✅ Role: super_admin (in admin_profiles table)
- ✅ Profile is active
- ✅ Code is already using `createClient()` correctly

## 🎯 Root Cause
**The RLS policies are checking the WRONG location for your role!**

Your role is stored in: `admin_profiles.role = 'super_admin'` ✅

But the RLS policies are checking: `auth.users.raw_user_meta_data->>'role'` ❌

These are two different tables/fields, so the policies can't find your admin role!

---

## 🔧 SOLUTION - 2 Steps

### Step 1: Apply the Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the **ENTIRE contents** of: `/app/QUICK_FIX_RLS.sql`
4. Click **Run** (or F5)

**This script will:**
- ✅ Create `is_storage_admin()` function that checks `admin_profiles` table
- ✅ Create `is_super_admin()` function for super admin checks
- ✅ Update ALL storage policies to use these functions
- ✅ Fix policies for: product-images, categories, avatars, banners buckets

**Expected Output:**
```
DROP POLICY
DROP POLICY
...
CREATE POLICY
CREATE POLICY
...
(Success - no errors)
```

---

### Step 2: Refresh Your Browser Session

Even though we fixed the database, your browser has cached the old session.

**Do ALL of these steps:**

1. **Log out** from admin dashboard
2. **Hard refresh** (Ctrl + Shift + R on Windows/Linux, Cmd + Shift + R on Mac)
3. **Clear browser data**:
   - Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Time range: "Last hour" or "All time"
   - Click "Clear data"
4. **Close all tabs** of your site
5. **Reopen browser** (or use incognito/private window)
6. **Log back in** with: mainfordudemw@gmail.com

---

## 🧪 Test Image Uploads

### Test 1: Category Image Upload
1. Go to: `/admin/categories/create`
2. Navigate to **"Media Assets"** step
3. Try uploading:
   - Homepage Thumbnail
   - PLP Square Thumbnail
4. **Expected**: ✅ Images upload successfully, no RLS errors

### Test 2: Product Variant Image Upload
1. Go to any product with variants
2. Click on a variant to view details
3. Click **"Upload Images"** or click the upload area
4. Select one or more images
5. **Expected**: ✅ Images upload to `variant-images/` folder successfully

---

## 🔍 Troubleshooting

### Still Getting RLS Error After Fix?

**Check 1: Verify the function exists**
Run this in SQL Editor:
```sql
SELECT is_storage_admin();
```

**Expected**: `true` (because you're a super_admin)

If you get an error "function does not exist", the script didn't run correctly. Try running `/app/RLS_FIX_CLEAN.sql` again.

---

**Check 2: Verify policies are using the function**
Run this in SQL Editor:
```sql
SELECT policyname, cmd, definition
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%categories%';
```

**Expected**: Policies should have `is_storage_admin()` in the definition, NOT `raw_user_meta_data`.

---

**Check 3: Browser Console Error**
1. Open browser console (F12)
2. Go to **Console** tab
3. Try uploading again
4. Look for the exact error message

Share the error if it's different from "row-level security policy violation".

---

**Check 4: Session Check**
Run in browser console (F12):
```javascript
const supabase = (await import('/src/lib/supabase/client.ts')).createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('User ID:', session?.user?.id)
console.log('Email:', session?.user?.email)
```

**Expected**: Should match your logged-in user details.

---

## 📋 Success Checklist

After following all steps, you should have:

- [x] Ran diagnostic SQL (optional)
- [x] Ran `/app/RLS_FIX_CLEAN.sql` successfully
- [x] Logged out from admin dashboard
- [x] Cleared browser cache completely
- [x] Logged back in
- [x] Category image upload works ✅
- [x] Product variant image upload works ✅
- [x] No "row-level security policy" errors ✅

---

## 🎯 Why This Fix Works

**Before (Broken):**
```sql
-- Policy checked:
auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
-- Your actual role location:
admin_profiles.role = 'super_admin'
-- Result: NULL ≠ 'super_admin' → ❌ RLS FAILS
```

**After (Fixed):**
```sql
-- Policy checks:
is_storage_admin() -- This function looks in admin_profiles table
-- Your actual role location:
admin_profiles.role = 'super_admin'
-- Result: super_admin found → ✅ RLS PASSES
```

The key is using a **SECURITY DEFINER** function that bypasses RLS when checking the admin_profiles table, preventing infinite recursion while properly checking your actual role.

---

## 📞 Need More Help?

If you've followed all steps and it's still not working:

1. Share the output of `/app/VERIFY_RLS_ISSUE.sql`
2. Share the browser console error (exact message)
3. Share a screenshot of the error toast/message

The RLS fix should work for your setup since:
- ✅ You have proper admin profile
- ✅ Code is using `createClient()` correctly
- ✅ You just need the policies to check the right table

---

**Ready to fix it?** Start with Step 1 above! 🚀
