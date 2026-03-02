# 🔧 Supabase Storage Bucket Fix

## 🐛 Problem
**Error:** `StorageApiError: new row violates row-level security policy`

**Cause:** The `product-images` storage bucket doesn't have proper RLS policies configured.

---

## ✅ Solution: Clean Bucket Setup

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**

### Step 2: Run the Setup Script
Copy and paste the entire contents of this file:
```
/app/backend-implementation/06-setup-storage-bucket.sql
```

Or run this script directly:

```sql
-- ================================================
-- CLEAN SETUP: DROP AND RECREATE BUCKET
-- ================================================

-- 1. Drop existing bucket (clean slate)
DELETE FROM storage.buckets WHERE id = 'product-images';

-- 2. Create new bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- 3. Create RLS policies for storage

-- Allow admins to upload
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

-- Allow admins to update
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

-- Allow admins to delete
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

-- Allow public read access
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');
```

### Step 3: Execute
Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

---

## 🔍 Verification

After running the script, you should see:
```
✅ Bucket "product-images" created successfully!
✅ Created 4 storage policies for product images
```

---

## 🧪 Testing

### Test 1: Verify Your User Role
Run this query to check your user has admin access:

```sql
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as user_role,
    created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- Replace with your email
```

**Expected:** `user_role` should be `'admin'` or `'owner'`

### Test 2: Update User Role (If Needed)
If your user role is NULL or not admin, run:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';  -- Replace with your email
```

### Test 3: Try Uploading
1. Go to your admin dashboard
2. Navigate to Products → Create/Edit Product
3. Go to the "Media" tab
4. Try uploading an image
5. ✅ Upload should work now!

---

## 📋 What This Script Does

### 1. **Drops Existing Bucket**
   - Removes the old `product-images` bucket
   - Cleans up any misconfigured policies
   - **⚠️ Warning:** This deletes all existing images in the bucket

### 2. **Creates Fresh Bucket**
   - Name: `product-images`
   - Public: Yes (files accessible via public URL)
   - Max file size: 10MB
   - Allowed types: JPEG, PNG, GIF, WebP

### 3. **Adds RLS Policies**
   - **INSERT:** Only authenticated admin/owner users can upload
   - **UPDATE:** Only authenticated admin/owner users can update
   - **DELETE:** Only authenticated admin/owner users can delete
   - **SELECT:** Everyone can view/download (public read)

---

## 🚨 Important Notes

### Before Running:
- ⚠️ **Backup Warning:** This script will DELETE the existing bucket and all its contents
- If you have existing product images, they will be lost
- Consider backing up images first if needed

### After Running:
- All admin users can now upload images
- Images are publicly accessible (required for e-commerce)
- 10MB file size limit per image
- Only image formats are allowed

---

## 🔧 Troubleshooting

### Issue: "Bucket already exists"
**Solution:** The DELETE might have failed. Try:
```sql
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'product-images';
```
Then run the main script again.

### Issue: "Still getting RLS error"
**Check these:**
1. ✅ Is your user role set to 'admin' or 'owner'?
2. ✅ Are you logged in when uploading?
3. ✅ Did the policies create successfully?

**Verify policies:**
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%product images%';
```

### Issue: "User role is NULL"
Run the UPDATE query in Test 2 above to set your role to admin.

---

## 📚 Additional Resources

- [Supabase Storage RLS Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/policies)

---

## ✅ Success Checklist

- [ ] Ran the SQL script in Supabase SQL Editor
- [ ] Saw success messages in output
- [ ] Verified user role is 'admin' or 'owner'
- [ ] Tested image upload - works!
- [ ] Images are publicly accessible via URL

---

**Status:** Once you run this script, the upload error will be fixed! 🎉
