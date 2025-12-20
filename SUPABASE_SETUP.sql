-- ================================================
-- COMPLETE STORAGE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ================================================
-- This script fixes all image upload issues by:
-- 1. Setting admin role for your user
-- 2. Creating storage buckets
-- 3. Setting up RLS policies
-- ================================================

-- ================================================
-- STEP 1: SET ADMIN ROLE FOR YOUR USER
-- ================================================
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

-- ================================================
-- STEP 2: CREATE ALL STORAGE BUCKETS
-- ================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('collections', 'collections', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STEP 3: DROP EXISTING POLICIES (CLEAN SLATE)
-- ================================================
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

-- ================================================
-- STEP 4: CREATE ADMIN UPLOAD POLICIES
-- ================================================
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

-- ================================================
-- STEP 5: CREATE ADMIN UPDATE POLICIES
-- ================================================
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

-- ================================================
-- STEP 6: CREATE ADMIN DELETE POLICIES
-- ================================================
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

-- ================================================
-- STEP 7: CREATE AVATAR POLICIES (USER-SPECIFIC)
-- ================================================
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

-- ================================================
-- STEP 8: CREATE PUBLIC READ POLICIES
-- ================================================
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

-- ================================================
-- STEP 9: VERIFICATION
-- ================================================
-- Check buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('product-images', 'banners', 'categories', 'collections', 'avatars');

-- Check policies count
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify your admin role (should show 'admin')
SELECT 
    email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'mainfordudemw@gmail.com';

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   ✅ STORAGE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was configured:';
    RAISE NOTICE '  ✅ Admin role set for mainfordudemw@gmail.com';
    RAISE NOTICE '  ✅ 5 storage buckets created';
    RAISE NOTICE '  ✅ 20 RLS policies created';
    RAISE NOTICE '  ✅ Public read access enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Log out from your admin dashboard';
    RAISE NOTICE '  2. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '  3. Log back in with mainfordudemw@gmail.com';
    RAISE NOTICE '  4. Test image uploads in Categories and Products';
    RAISE NOTICE '';
    RAISE NOTICE 'If uploads still fail:';
    RAISE NOTICE '  - Check browser console for errors';
    RAISE NOTICE '  - Verify you are logged in';
    RAISE NOTICE '  - Try incognito mode';
    RAISE NOTICE '';
END $$;
