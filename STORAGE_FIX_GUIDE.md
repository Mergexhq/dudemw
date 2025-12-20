# 🔧 Storage Upload Fix Guide

## Issue Summary
You're experiencing **Row-Level Security (RLS) policy violations** when uploading images because:
1. Your user account doesn't have the 'admin' role set in Supabase Auth
2. Storage bucket RLS policies require admin role for uploads
3. Product variant image uploads aren't actually uploading to storage (code bug)

## ✅ Step-by-Step Fix

### Step 1: Set Your Admin Role in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your production project**
3. **Navigate to**: SQL Editor (left sidebar)
4. **Run this SQL command**:

```sql
-- Set admin role for your user
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'mainfordudemw@gmail.com';

-- Verify the role was set
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as user_role,
    created_at
FROM auth.users
WHERE email = 'mainfordudemw@gmail.com';
```

**Expected Output**: You should see `user_role` as `admin`

---

### Step 2: Setup Storage Buckets and RLS Policies

**Go to SQL Editor again** and run the complete storage setup script:

```sql
-- ================================================
-- SETUP ALL STORAGE BUCKETS WITH RLS POLICIES
-- ================================================

-- STEP 1: CREATE ALL BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('collections', 'collections', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STEP 2: DROP EXISTING POLICIES (CLEAN SLATE)
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view categories" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete collections" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view collections" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- STEP 3: CREATE ADMIN UPLOAD POLICIES
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can upload categories"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can upload collections"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'collections' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

-- STEP 4: CREATE ADMIN UPDATE POLICIES
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can update categories"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can update collections"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'collections'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

-- STEP 5: CREATE ADMIN DELETE POLICIES
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can delete categories"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can delete collections"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'collections'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);

-- STEP 6: CREATE AVATAR POLICIES (USER-SPECIFIC)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- STEP 7: CREATE PUBLIC READ POLICIES
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'banners');

CREATE POLICY "Anyone can view categories"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'categories');

CREATE POLICY "Anyone can view collections"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'collections');

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

---

### Step 3: Verify Setup

Run this verification query:

```sql
-- Check buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('product-images', 'banners', 'categories', 'collections', 'avatars');

-- Check policies count
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify your admin role
SELECT 
    email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'mainfordudemw@gmail.com';
```

**Expected Results**:
- 5 buckets found
- ~20+ policies created
- Your role shows as 'admin'

---

### Step 4: Clear Browser Cache & Re-login

1. **Log out** from your admin dashboard
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Log back in** with mainfordudemw@gmail.com
4. **Test image upload** in Categories or Products

---

## 🧪 Testing

### Test Category Image Upload:
1. Go to: `/admin/categories/create`
2. Navigate to "Media Assets" step
3. Try uploading a homepage thumbnail
4. Should work without RLS errors ✅

### Test Product Variant Image Upload:
1. Go to: `/admin/products/create`
2. Navigate to "Media" tab
3. Try uploading product images
4. Should now properly upload to storage ✅

---

## 🔍 Troubleshooting

### Still Getting RLS Errors?
1. **Verify admin role is set**: Run the role verification query again
2. **Check if you're logged in**: The policies require `authenticated` users
3. **Try incognito mode**: To rule out cache issues
4. **Check browser console**: Look for detailed error messages

### Images Not Appearing?
1. **Check bucket is public**: All buckets should have `public = true`
2. **Verify public read policy**: The "Anyone can view" policies must exist
3. **Check CORS settings**: In Supabase Storage settings

### Store Settings Error?
The store settings error will be fixed by the code changes. If it persists:
1. Check if `store_settings` table has RLS enabled
2. Verify the admin RLS policies on `store_settings` table

---

## 📝 What Was Fixed in Code

1. **Product Image Upload**: Now properly uploads to `product-images` bucket (was broken)
2. **Error Logging**: Better error messages in settings service
3. **Storage Service**: Added proper upload functionality for product images

---

## ✅ Success Indicators

You'll know everything is working when:
- ✅ No "row level security policy" errors
- ✅ Images upload successfully in Categories
- ✅ Images upload successfully in Products
- ✅ Uploaded images appear in Supabase Storage
- ✅ Images display correctly on your site
- ✅ No "Error creating default store settings" in console

---

## 🆘 Need Help?

If you still face issues after following these steps:
1. Share the exact error message from browser console
2. Confirm your admin role is set (run verification query)
3. Check Supabase Storage logs in dashboard
