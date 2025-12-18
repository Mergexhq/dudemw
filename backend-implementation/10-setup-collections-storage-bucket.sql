-- ================================================
-- SETUP STORAGE BUCKET FOR COLLECTIONS
-- ================================================
-- This script creates the collections storage bucket with proper RLS policies
-- Execute this in Supabase SQL Editor
-- ================================================

-- ================================================
-- STEP 1: DROP EXISTING BUCKET (Clean Setup)
-- ================================================

-- Drop the existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'collections';

-- ================================================
-- STEP 2: CREATE NEW BUCKET
-- ================================================

-- Create the collections bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collections',
  'collections',
  true,  -- Public bucket (collection images need to be publicly accessible)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STEP 3: CREATE STORAGE RLS POLICIES
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete collections" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view collections" ON storage.objects;

-- Policy 1: Allow authenticated admin users to upload (INSERT)
CREATE POLICY "Admins can upload collections"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'collections' 
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
CREATE POLICY "Admins can update collections"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'collections'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 3: Allow authenticated admin users to delete
CREATE POLICY "Admins can delete collections"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'collections'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  )
);

-- Policy 4: Allow everyone to view/read collections (Public access)
CREATE POLICY "Anyone can view collections"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'collections');

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
        SELECT 1 FROM storage.buckets WHERE id = 'collections'
    ) INTO bucket_exists;
    
    -- Count policies for this bucket
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%collections%';
    
    -- Display results
    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket "collections" created successfully!';
    ELSE
        RAISE NOTICE '❌ Bucket creation failed!';
    END IF;
    
    RAISE NOTICE '✅ Created % storage policies for collections', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COLLECTIONS STORAGE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket Configuration:';
    RAISE NOTICE '  - Name: collections';
    RAISE NOTICE '  - Public: Yes (images are publicly accessible)';
    RAISE NOTICE '  - Max File Size: 5MB';
    RAISE NOTICE '  - Allowed Types: JPEG, PNG, WebP';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - Admins: Can upload, update, delete';
    RAISE NOTICE '  - Public: Can view/download';
    RAISE NOTICE '';
    RAISE NOTICE 'Status:';
    RAISE NOTICE '  - Bucket ready for future use';
    RAISE NOTICE '  - Upload UI not yet implemented';
    RAISE NOTICE '  - Can add image upload to /admin/collections later';
    RAISE NOTICE '';
END $$;

-- ================================================
-- FUTURE IMPLEMENTATION
-- ================================================
-- To add collection image uploads:
-- 1. Add image_url field to collections form
-- 2. Create upload service similar to banners
-- 3. Add to /admin/collections page
-- 4. Update collection cards to show images