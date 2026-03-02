# 🔧 Fix Image Upload RLS Error - Complete Guide

## ❌ Current Problem
You're getting this error when uploading images:
```
StorageApiError: new row violates row-level security policy
```

## ✅ Solution Steps

### Step 1: Run the SQL Fix Script

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: qyvpihdiyuowkyideltd
3. **Navigate to**: SQL Editor (in the left sidebar)
4. **Click**: "New Query"
5. **Copy and paste the entire contents** of `/app/FIX_RLS_STORAGE_POLICIES.sql`
6. **Click**: "Run" button (or press F5)

**Expected Output:**
You should see messages like:
```
✅ User mainfordudemw@gmail.com has role: admin
✅ RLS POLICIES SETUP COMPLETE!
Product Images: 4 policies
Categories: 4 policies
```

---

### Step 2: Refresh Your Session (CRITICAL!)

The RLS policies check your **session metadata**. Even though we set the admin role, your current browser session still has the old metadata without the role.

**You MUST do all of these:**

1. **Log out** from your admin dashboard completely
2. **Clear browser cache**:
   - Chrome/Edge: Press `Ctrl + Shift + Delete`
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"
3. **Close all browser tabs** for your site
4. **Open a new incognito/private window** (optional but recommended for first test)
5. **Log back in** with: `mainfordudemw@gmail.com`

---

### Step 3: Test Image Upload

#### Test Category Image Upload:
1. Go to: `http://localhost:3000/admin/categories/create`
2. Navigate to "Media Assets" step
3. Try uploading a homepage thumbnail
4. **Expected**: ✅ Upload should succeed without RLS error

#### Test Product Variant Image Upload:
1. Go to any product with variants
2. Click on a variant
3. Try uploading variant images
4. **Expected**: ✅ Upload should succeed without RLS error

---

## 🔍 Troubleshooting

### Still Getting RLS Error?

**Check 1: Verify Your Session**

Open browser console (F12) and run:
```javascript
// Get your current session
const supabase = (await import('/src/lib/supabase/client.ts')).createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Current user:', session?.user?.email)
console.log('User role:', session?.user?.user_metadata?.role)
```

**Expected output:**
```
Current user: mainfordudemw@gmail.com
User role: admin
```

If role is `undefined`, your session hasn't been refreshed. Log out and back in again.

---

**Check 2: Verify RLS Policies in Supabase**

1. Go to Supabase Dashboard
2. Click "Storage" in the left sidebar
3. Click "Policies" tab
4. You should see these policies:
   - ✅ Admins can upload product images
   - ✅ Admins can update product images
   - ✅ Admins can delete product images
   - ✅ Anyone can view product images
   - ✅ Admins can upload categories
   - ✅ Admins can update categories
   - ✅ Admins can delete categories
   - ✅ Anyone can view categories

---

**Check 3: Verify in SQL Editor**

Run this query in Supabase SQL Editor:
```sql
-- Check your user role
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as user_role,
    created_at
FROM auth.users
WHERE email = 'mainfordudemw@gmail.com';
```

**Expected result:**
| email | user_role |
|-------|-----------|
| mainfordudemw@gmail.com | admin |

If `user_role` is NULL, run:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'mainfordudemw@gmail.com';
```

---

## 🎯 Why This Happens

The RLS policies check for:
```sql
auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
```

When you log in, Supabase creates a JWT token with your user data. This token includes your `user_metadata`. If your role was set AFTER you logged in, the token still has the old metadata.

**The fix:** Log out and log back in to get a fresh JWT token with the updated role.

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No RLS policy violation errors in console
- ✅ Images upload successfully
- ✅ You see success toasts when uploading
- ✅ Images appear in the gallery immediately
- ✅ Images are stored in Supabase Storage
- ✅ Images load without authentication issues

---

## 📞 Still Not Working?

If you've followed all steps and still getting errors:

1. **Share the output** of the SQL verification queries
2. **Share browser console logs** (full error stack trace)
3. **Verify Supabase project settings**:
   - Go to Supabase Dashboard > Project Settings > API
   - Make sure "RLS is enabled" for storage.objects
4. **Try in a different browser** to rule out cache issues

---

## 🔑 Technical Details

### What Changed:

1. **Admin Role**: Set in `auth.users.raw_user_meta_data`
2. **RLS Policies**: Updated to check for admin role correctly
3. **Session**: Must be refreshed to include new metadata
4. **Code**: Already using `createClient()` correctly (no changes needed)

### Policy Structure:
```sql
-- For product-images and categories buckets:
- INSERT: Requires authenticated user with admin/owner role
- UPDATE: Requires authenticated user with admin/owner role  
- DELETE: Requires authenticated user with admin/owner role
- SELECT: Public (anyone can view)
```

---

## 📋 Quick Checklist

- [ ] Ran `/app/FIX_RLS_STORAGE_POLICIES.sql` in Supabase SQL Editor
- [ ] Saw success messages with policy counts
- [ ] Logged out from admin dashboard
- [ ] Cleared browser cache completely
- [ ] Closed all browser tabs
- [ ] Logged back in with mainfordudemw@gmail.com
- [ ] Tested category image upload - works! ✅
- [ ] Tested product variant image upload - works! ✅

---

**That's it!** After following these steps, your image uploads should work perfectly. The key is refreshing your browser session after setting the admin role. 🎉
