-- ================================================
-- SETUP STORAGE BUCKET FOR AVATARS
-- ================================================
-- This script creates the avatars storage bucket with proper RLS policies
-- Execute this in Supabase SQL Editor
-- ================================================

-- ================================================
-- STEP 1: DROP EXISTING BUCKET (Clean Setup)
-- ================================================

-- Drop the existing bucket if it exists
DELETE FROM storage.buckets WHERE id = 'avatars';

-- ================================================
-- STEP 2: CREATE NEW BUCKET
-- ================================================

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket (profile pictures need to be publicly accessible)
  2097152,  -- 2MB file size limit (avatars don't need to be large)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STEP 3: CREATE STORAGE RLS POLICIES
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow everyone to view avatars (Public access)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

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
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) INTO bucket_exists;
    
    -- Count policies for this bucket
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%avatar%';
    
    -- Display results
    IF bucket_exists THEN
        RAISE NOTICE '✅ Bucket "avatars" created successfully!';
    ELSE
        RAISE NOTICE '❌ Bucket creation failed!';
    END IF;
    
    RAISE NOTICE '✅ Created % storage policies for avatars', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AVATARS STORAGE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Bucket Configuration:';
    RAISE NOTICE '  - Name: avatars';
    RAISE NOTICE '  - Public: Yes (profile pictures are publicly accessible)';
    RAISE NOTICE '  - Max File Size: 2MB';
    RAISE NOTICE '  - Allowed Types: JPEG, PNG, WebP';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - Users: Can upload/update/delete their own avatar';
    RAISE NOTICE '  - Public: Can view all avatars';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  - Users can only modify their own avatars';
    RAISE NOTICE '  - File path structure: avatars/{user_id}/filename.jpg';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to use in:';
    RAISE NOTICE '  - /admin/settings/profile';
    RAISE NOTICE '';
END $$;

-- ================================================
-- NOTES
-- ================================================
-- The avatar bucket uses user-specific folders for security.
-- Each user can only upload/modify files in their own folder.
-- Folder structure: avatars/{user_id}/avatar.jpg
--
-- The profile page upload is already implemented at:
-- src/app/admin/settings/profile/page.tsx (Line 115)