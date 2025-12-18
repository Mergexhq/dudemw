-- ================================================
-- SETUP STORAGE BUCKET FOR CATEGORIES
-- ================================================
-- This script creates the categories storage bucket with proper RLS policies
-- Execute this in Supabase SQL Editor
-- ================================================

-- ================================================
-- STEP 1: DROP EXISTING BUCKET (Clean Setup)
-- ================================================

-- Drop the existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'categories';

-- ================================================
-- STEP 2: CREATE NEW BUCKET
-- ================================================

-- Create the categories bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories',
  'categories',
  true,  -- Public bucket (files are publicly accessible via URL)
  5242880,  -- 5MB file size limit (categories need smaller images)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']  -- Allowed image types + SVG for icons
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STEP 3: CREATE STORAGE RLS POLICIES
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view categories" ON storage.objects;

-- Policy 1: Allow authenticated admin users to upload (INSERT)
CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 2: Allow authenticated admin users to update
CREATE POLICY "Admins can update categories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'categories'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 3: Allow authenticated admin users to delete
CREATE POLICY "Admins can delete categories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'categories'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 4: Allow everyone to view/read categories (Public access)
CREATE POLICY "Anyone can view categories"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'categories');

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
        SELECT 1 FROM storage.buckets WHERE id = 'categories'
    ) INTO bucket_exists;
    
    -- Count policies for this bucket
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%categories%';
    
    -- Display results
    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket "categories" created successfully!';
    ELSE
        RAISE NOTICE '❌ Bucket creation failed!';
    END IF;
    
    RAISE NOTICE '✅ Created % storage policies for categories', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORIES STORAGE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket Configuration:';
    RAISE NOTICE '  - Name: categories';
    RAISE NOTICE '  - Public: Yes (files are publicly accessible)';
    RAISE NOTICE '  - Max File Size: 5MB';
    RAISE NOTICE '  - Allowed Types: JPEG, PNG, WebP, SVG';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - Admins: Can upload, update, delete';
    RAISE NOTICE '  - Public: Can view/download';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Step:';
    RAISE NOTICE '  - Update categories service to use "categories" bucket';
    RAISE NOTICE '  - Change from "public-assets" to "categories"';
    RAISE NOTICE '';
END $$;

-- ================================================
-- CODE UPDATE REQUIRED
-- ================================================
-- After running this script, update the code in:
-- src/lib/services/categories.ts
--
-- Change line 294 from:
--   .from('public-assets')
-- To:
--   .from('categories')
--
-- Also update line 299 and 319 similarly.