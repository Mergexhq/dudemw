-- ================================================
-- SETUP STORAGE BUCKET FOR PRODUCT IMAGES
-- ================================================
-- This script creates a clean storage bucket with proper RLS policies
-- Execute this in Supabase SQL Editor
-- ================================================

-- ================================================
-- STEP 1: DROP EXISTING BUCKET (Clean Setup)
-- ================================================

-- Drop the existing bucket if it exists
-- This will also delete all files in the bucket
DELETE FROM storage.buckets WHERE id = 'product-images';

-- ================================================
-- STEP 2: CREATE NEW BUCKET
-- ================================================

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- Public bucket (files are publicly accessible via URL)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']  -- Allowed image types
);

-- ================================================
-- STEP 3: CREATE STORAGE RLS POLICIES
-- ================================================

-- Policy 1: Allow authenticated admin users to upload (INSERT)
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (
    -- Check if user is admin using the same function from database RLS
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 2: Allow authenticated admin users to update
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 3: Allow authenticated admin users to delete
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 4: Allow everyone to view/read product images (Public access)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ================================================
-- STEP 4: VERIFICATION
-- ================================================

-- Check if bucket was created successfully
DO $$ 
DECLARE
    bucket_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check bucket
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'product-images'
    ) INTO bucket_exists;
    
    -- Count policies for this bucket
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%product images%';
    
    -- Display results
    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket "product-images" created successfully!';
    ELSE
        RAISE NOTICE '❌ Bucket creation failed!';
    END IF;
    
    RAISE NOTICE '✅ Created % storage policies for product images', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STORAGE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket Configuration:';
    RAISE NOTICE '  - Name: product-images';
    RAISE NOTICE '  - Public: Yes (files are publicly accessible)';
    RAISE NOTICE '  - Max File Size: 10MB';
    RAISE NOTICE '  - Allowed Types: JPEG, PNG, GIF, WebP';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - Admins: Can upload, update, delete';
    RAISE NOTICE '  - Public: Can view/download';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Try uploading a product image';
    RAISE NOTICE '  2. Verify your user has admin role in auth.users';
    RAISE NOTICE '';
END $$;

-- ================================================
-- TROUBLESHOOTING QUERY
-- ================================================
-- If uploads still fail, run this to check your user role:

-- SELECT 
--     id,
--     email,
--     raw_user_meta_data->>'role' as user_role,
--     created_at
-- FROM auth.users
-- WHERE id = auth.uid();

-- If your role is NULL or not 'admin'/'owner', update it with:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE id = auth.uid();
