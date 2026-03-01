# 🪣 Supabase Storage Bucket Setup Guide

## 🔴 Error You're Seeing:
```
Error uploading banner image: Error [StorageApiError]: Bucket not found
status: 400,
statusCode: '404'
```

## 🎯 The Problem:
The `banners` storage bucket doesn't exist in your Supabase project. You need to create it.

## ✅ Solution: Create the Storage Bucket

### **Method 1: Using Supabase Dashboard (Recommended)**

#### Step 1: Login to Supabase
1. Go to https://supabase.com/dashboard
2. Select your project: **dudemw**

#### Step 2: Create the Banners Bucket
1. Click on **"Storage"** in the left sidebar
2. Click **"New bucket"** button
3. Fill in the details:
   - **Name:** `banners`
   - **Public bucket:** ✅ **Check this** (banners need to be publicly accessible)
   - **File size limit:** 10 MB (or your preference)
   - **Allowed MIME types:** Leave empty (or add: image/jpeg, image/png, image/webp)

4. Click **"Create bucket"**

#### Step 3: Configure Bucket Policies (IMPORTANT!)

After creating the bucket, you need to set up policies for upload/access:

1. Click on the **"banners"** bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**

**Policy 1: Allow Public Read Access**
```sql
-- Name: Public read access for banners
-- Policy for: SELECT

CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');
```

**Policy 2: Allow Authenticated Users to Upload**
```sql
-- Name: Authenticated users can upload banners
-- Policy for: INSERT

CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');
```

**Policy 3: Allow Authenticated Users to Update**
```sql
-- Name: Authenticated users can update banners
-- Policy for: UPDATE

CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');
```

**Policy 4: Allow Authenticated Users to Delete**
```sql
-- Name: Authenticated users can delete banners
-- Policy for: DELETE

CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');
```

### **Method 2: Using SQL Editor**

If you prefer SQL, go to **SQL Editor** and run:

```sql
-- Create the banners storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create policies
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');
```

### **Method 3: Using Supabase CLI**

If you have Supabase CLI:

```bash
# Create migration file
supabase migration new create_banners_bucket

# Add the SQL from Method 2 to the migration file

# Run migration
supabase db push
```

## 🧪 Verify the Setup

### Test 1: Check Bucket Exists
Go to Supabase Dashboard → Storage → You should see "banners" bucket

### Test 2: Check Policies
```sql
-- Run in SQL Editor
SELECT * FROM storage.buckets WHERE name = 'banners';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%banner%';
```

### Test 3: Test Upload from Your App
1. Go to your admin panel: `http://localhost:3000/admin/banners`
2. Try uploading a banner image
3. Should work without "Bucket not found" error

## 📋 Complete Storage Buckets Needed

Your e-commerce site will likely need these buckets:

1. **✅ banners** - For banner/hero images
2. **products** - For product images
3. **categories** - For category images
4. **collections** - For collection images
5. **avatars** - For user profile pictures

### Create All Buckets at Once:

```sql
-- Create all storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('collections', 'collections', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create read policies for all buckets
CREATE POLICY "Public read access" ON storage.objects FOR SELECT TO public
USING (bucket_id IN ('banners', 'products', 'categories', 'collections', 'avatars'));

-- Create upload policies for authenticated users
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('banners', 'products', 'categories', 'collections', 'avatars'));

CREATE POLICY "Authenticated update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('banners', 'products', 'categories', 'collections', 'avatars'));

CREATE POLICY "Authenticated delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('banners', 'products', 'categories', 'collections', 'avatars'));
```

## 🐛 Troubleshooting

### Issue: Still getting "Bucket not found"
**Solution:**
1. Clear browser cache
2. Restart your Next.js dev server: `npm run dev`
3. Check Supabase Dashboard → Storage to confirm bucket exists
4. Verify your `.env.local` has correct Supabase credentials

### Issue: "Access denied" error
**Solution:** 
- Make sure policies are created
- Ensure user is authenticated when uploading
- Check if bucket is marked as "public" in Supabase

### Issue: "Row level security policy violation"
**Solution:**
- Verify the policies are correctly created
- Make sure you're logged in as admin when uploading
- Try using `supabaseAdmin` client instead of regular `supabase` client

## 🔒 Security Best Practices

1. **Public Buckets:** Only make buckets public if the files need to be accessible without authentication (like product images, banners)

2. **File Size Limits:** Set appropriate limits:
   - Banners: 10MB
   - Products: 5-10MB
   - Avatars: 2MB

3. **MIME Type Restrictions:** Only allow image types you need

4. **Admin Only Uploads:** For sensitive buckets, restrict upload to admin role:
   ```sql
   CREATE POLICY "Only admins can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'banners' AND
     auth.jwt() ->> 'role' = 'admin'
   );
   ```

## 📸 Expected Result

After setup, your banner upload should work like this:

1. User uploads image → 
2. File saved to `banners/[unique-filename].jpg` → 
3. Returns public URL: `https://[project].supabase.co/storage/v1/object/public/banners/[filename].jpg` →
4. URL saved in `banners` table `image_url` column →
5. Banner displays on website ✅

---

**Need more help?** Check the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
