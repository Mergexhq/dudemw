# 🎯 SUPER ADMIN RLS FIX - Complete Guide

## 🔍 Root Cause Identified!

Your **super admin** is created via the custom admin system (`/admin/setup`) which stores roles in the `admin_profiles` table. However, the storage RLS policies were checking `auth.users.raw_user_meta_data->>'role'` which doesn't exist for super admins!

### The Conflict:
- ❌ **Old RLS Policies**: Checked `auth.users.raw_user_meta_data->>'role'`
- ✅ **Your System**: Stores role in `admin_profiles.role`
- 🔥 **Result**: RLS policies rejected your uploads!

---

## ✅ The Fix (2 Steps)

### Step 1: Run the Correct SQL Script

1. **Open Supabase Dashboard** → SQL Editor
2. **Open the file**: `/app/FIX_STORAGE_RLS_FOR_ADMIN_PROFILES.sql`
3. **Copy the entire contents**
4. **Paste into SQL Editor**
5. **Click "Run"** (or press F5)

**Expected Output:**
```
✅ Admin profile found for mainfordudemw@gmail.com
   Role: super_admin
   Active: true

✅ STORAGE RLS POLICIES FIXED!
   Product Images: 4 policies
   Categories: 4 policies
```

---

### Step 2: Refresh Your Browser Session

Even though the database is fixed, your browser still has old session data.

**Do ALL of these:**

1. **Log out** completely from admin dashboard
2. **Close ALL tabs** of your site (localhost:3000)
3. **Clear browser cache**:
   - Press `Ctrl + Shift + Delete`
   - Check "Cookies and site data"
   - Check "Cached images and files"
   - Click "Clear data"
4. **Restart browser** (optional but recommended)
5. **Open fresh tab** and go to `http://localhost:3000/admin/login`
6. **Log in** with mainfordudemw@gmail.com

---

## 🧪 Verify the Fix

### Option 1: Use Debug Page

1. Visit: `http://localhost:3000/admin/auth-debug`
2. **Check these indicators**:
   - ✅ "Ready to Upload" green badge at top
   - ✅ Admin Profile → Role: `super_admin`
   - ✅ Admin Profile → Status: `Active`
   - ✅ Storage Access → "Can access storage"
3. **Click "Test Upload to Categories Bucket"**
   - Should show success alert: "✅ Upload Success!"

### Option 2: Test Actual Upload

1. Go to: `http://localhost:3000/admin/categories/create`
2. Navigate to "Media Assets" step
3. Try uploading a category image
4. **Expected**: ✅ Success toast, image appears

---

## 🔍 What Changed?

### Before (Broken):
```sql
-- Old policy checked wrong location
CREATE POLICY "Admins can upload categories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')  -- ❌ Not set for super admins!
  )
);
```

### After (Fixed):
```sql
-- New policy checks admin_profiles table
CREATE POLICY "Admins can upload categories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')  -- ✅ Checks admin_profiles!
  )
);
```

---

## 🎯 Key Points About Your Super Admin System

### How It Works:
1. Super admin created via `/admin/setup` page
2. User stored in `auth.users` (normal Supabase auth)
3. Role stored in `admin_profiles` table (custom)
4. Recovery key provided (for password recovery)

### Tables Involved:
- `auth.users` - Supabase authentication
- `admin_profiles` - Your custom admin roles & permissions
- `admin_settings` - System settings & recovery key

### Role Hierarchy:
- `super_admin` - Full access (you)
- `admin` - Most admin features
- `manager` - Limited admin features
- `staff` - Basic admin features

All of these roles can now upload images!

---

## 🆘 Troubleshooting

### Still Getting RLS Error After Fix?

**1. Verify SQL Script Ran Successfully**

Run this in SQL Editor:
```sql
-- Should return your admin info
SELECT 
    u.email,
    ap.role,
    ap.is_active
FROM auth.users u
JOIN admin_profiles ap ON ap.user_id = u.id
WHERE u.email = 'mainfordudemw@gmail.com';
```

Expected: `super_admin | true`

**2. Check Policy Exists**

```sql
-- Should return 4 for categories
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%categories%';
```

**3. Test Upload Permission**

```sql
-- Run this AFTER logging in
SELECT * FROM can_user_upload_to_storage();
```

Expected: `can_upload = true`

---

### Debug Page Shows "No Admin Profile"?

This means your user isn't in the `admin_profiles` table. Solutions:

**Option A: Re-setup (if setup not completed)**
1. Go to `/admin/setup`
2. Create super admin with your email
3. Save recovery key

**Option B: Add profile manually (if user exists)**
```sql
-- Add admin profile for existing user
INSERT INTO admin_profiles (user_id, role, is_active, approved_at)
SELECT id, 'super_admin', true, NOW()
FROM auth.users
WHERE email = 'mainfordudemw@gmail.com';
```

---

### Verification Failed in SQL?

If the verification query shows your profile doesn't exist:

```sql
-- Check if user exists in auth
SELECT id, email FROM auth.users WHERE email = 'mainfordudemw@gmail.com';

-- Check if profile exists
SELECT * FROM admin_profiles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mainfordudemw@gmail.com'
);
```

If user exists but no profile → Use Option B above to add profile.

---

## 📋 Success Checklist

After following the guide:

- [ ] SQL script ran successfully with green checkmarks
- [ ] Logged out completely
- [ ] Cleared browser cache
- [ ] Closed all browser tabs
- [ ] Logged back in
- [ ] Auth debug page shows "Ready to Upload"
- [ ] Auth debug page shows role as "super_admin" 
- [ ] Auth debug page shows status as "Active"
- [ ] Test upload button succeeds
- [ ] Category image upload works
- [ ] Product variant image upload works
- [ ] No RLS policy violation errors in console

---

## 🎉 Expected Result

After completing these steps:

✅ **Categories page** - Images upload successfully
✅ **Product variants page** - Images upload successfully  
✅ **No console errors** - Clean logs
✅ **Images persist** - Stored in Supabase Storage
✅ **Images load** - Public URLs work

---

## 💡 Why This Matters

Your ecommerce site has a **dual authentication system**:

1. **Customer Auth** - Regular Supabase users (for shopping)
2. **Admin Auth** - Custom admin system (for management)

The storage RLS policies needed to understand your custom admin system. Now they do! 🎉

---

## 📞 Still Stuck?

If issues persist after following ALL steps:

1. **Share screenshot** from `/admin/auth-debug` page
2. **Share SQL output** from verification queries
3. **Share browser console** error messages
4. **Confirm all steps completed** - especially cache clearing!

---

**Remember**: The key is that RLS policies now check the `admin_profiles` table instead of `user_metadata`. Your super admin system is fully supported! 🚀
