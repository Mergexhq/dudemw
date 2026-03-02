# 🔧 Quick Fix: Banner Upload Error "Bucket not found"

## 🔴 The Error You're Getting:

```
Error uploading banner image: Error [StorageApiError]: Bucket not found
status: 400,
statusCode: '404'
```

## ⚡ Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **dudemw** project

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### Step 3: Copy & Run This Script

Copy the entire script from:
```
/app/backend-implementation/07-setup-banners-storage-bucket.sql
```

Or copy-paste this directly:

```sql
-- Create banners bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;

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

CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'banners');
```

### Step 4: Click "Run"

You should see:
```
✅ Bucket "banners" created successfully!
✅ Created 4 storage policies for banners
```

### Step 5: Check Your User Role

Run this query:
```sql
SELECT 
    email,
    raw_user_meta_data->>'role' as user_role
FROM auth.users
WHERE id = auth.uid();
```

**Expected:** Your `user_role` should be **'admin'** or **'owner'**

### Step 6: Fix User Role (If Needed)

If your role is NULL or not admin, run this (replace with your email):

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

### Step 7: Test Upload

1. Go back to your app
2. Navigate to `/admin/banners`
3. Try uploading a banner again
4. ✅ Should work now!

---

## 🎯 What This Does

This script:
1. ✅ Creates the `banners` storage bucket
2. ✅ Makes it publicly accessible (required for displaying banners)
3. ✅ Sets up security policies (only admins can upload)
4. ✅ Allows anyone to view banners (public read)

---

## 🐛 Still Not Working?

### Check 1: Verify Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'banners';
```
Should return 1 row.

### Check 2: Verify Policies
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%banner%';
```
Should return 4 policies.

### Check 3: Verify You're Logged In
- Make sure you're logged into your admin account
- Try logging out and back in
- Clear browser cache

### Check 4: Restart Dev Server
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 📸 Expected Behavior After Fix

1. Go to `/admin/banners`
2. Click "Create Banner" or "Upload Image"
3. Select an image file (JPEG, PNG, WebP)
4. Upload succeeds ✅
5. Image appears in banner list
6. Public URL generated: `https://[project].supabase.co/storage/v1/object/public/banners/[filename]`

---

## 🔗 Related Files

- SQL Script: `/app/backend-implementation/07-setup-banners-storage-bucket.sql`
- Detailed Guide: `/app/docs/STORAGE_BUCKET_SETUP.md`
- Banner Service: `/app/src/lib/services/banners.ts`
- Upload API: `/app/src/app/api/admin/banners/upload/route.ts`

---

## ✅ Success Checklist

After running the script:
- [ ] Bucket "banners" exists in Supabase Storage
- [ ] 4 policies created and showing in output
- [ ] User role is 'admin' or 'owner'
- [ ] Banner upload works without errors
- [ ] Uploaded images are publicly accessible

---

**Need More Help?** Check the detailed guide at `/app/docs/STORAGE_BUCKET_SETUP.md`
