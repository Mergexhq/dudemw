-- ================================================
-- FIX INFINITE RECURSION IN STORAGE RLS POLICIES
-- ================================================
-- Problem: Storage RLS policies check admin_profiles table
--          But admin_profiles has RLS policies that also check admin_profiles
--          This creates infinite recursion!
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS
--           when checking if a user is an admin for storage operations
-- ================================================

-- ================================================
-- STEP 1: Create SECURITY DEFINER function
-- ================================================
-- This function bypasses RLS and directly checks admin_profiles
-- It's safe because it only returns a boolean (no data leakage)

CREATE OR REPLACE FUNCTION is_storage_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Direct query bypasses RLS (SECURITY DEFINER)
    SELECT EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    ) INTO admin_exists;
    
    RETURN COALESCE(admin_exists, FALSE);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION is_storage_admin() IS 
'Returns true if current user is an active admin. Used by storage RLS policies. SECURITY DEFINER bypasses RLS to prevent infinite recursion.';

-- ================================================
-- STEP 2: Drop ALL existing storage policies
-- ================================================

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view categories" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;

-- ================================================
-- STEP 3: Create NEW storage policies using the safe function
-- ================================================

-- ================================================
-- PRODUCT IMAGES BUCKET
-- ================================================

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND is_storage_admin()  -- Uses SECURITY DEFINER function
);

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND is_storage_admin()
);

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND is_storage_admin()
);

CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ================================================
-- CATEGORIES BUCKET
-- ================================================

CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND is_storage_admin()
);

CREATE POLICY "Admins can update categories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'categories'
  AND is_storage_admin()
);

CREATE POLICY "Admins can delete categories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'categories'
  AND is_storage_admin()
);

CREATE POLICY "Anyone can view categories"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'categories');

-- ================================================
-- AVATARS BUCKET (if exists)
-- ================================================

CREATE POLICY "Admins can upload to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND is_storage_admin()
);

CREATE POLICY "Admins can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND is_storage_admin()
);

CREATE POLICY "Admins can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND is_storage_admin()
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ================================================
-- BANNERS BUCKET (if exists)
-- ================================================

CREATE POLICY "Admins can upload banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' 
  AND is_storage_admin()
);

CREATE POLICY "Admins can update banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners'
  AND is_storage_admin()
);

CREATE POLICY "Admins can delete banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners'
  AND is_storage_admin()
);

CREATE POLICY "Anyone can view banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- ================================================
-- STEP 4: Verify setup
-- ================================================

DO $$ 
DECLARE
    storage_policy_count INTEGER;
    admin_count INTEGER;
BEGIN
    -- Count storage policies
    SELECT COUNT(*) INTO storage_policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects';
    
    -- Count active admins
    SELECT COUNT(*) INTO admin_count
    FROM admin_profiles
    WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INFINITE RECURSION FIX APPLIED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Storage Policies Created: %', storage_policy_count;
    RAISE NOTICE 'Active Admins: %', admin_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Key Changes:';
    RAISE NOTICE '  ✅ Created is_storage_admin() SECURITY DEFINER function';
    RAISE NOTICE '  ✅ Function bypasses RLS to prevent recursion';
    RAISE NOTICE '  ✅ All storage policies now use safe function';
    RAISE NOTICE '  ✅ No more direct admin_profiles queries in policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Log out completely';
    RAISE NOTICE '  2. Clear browser cache';
    RAISE NOTICE '  3. Log back in';
    RAISE NOTICE '  4. Try uploading images';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Result: ✅ No more recursion errors!';
    RAISE NOTICE '';
END $$;

-- ================================================
-- STEP 5: Test the function (optional)
-- ================================================
-- After logging in, you can test the function:
/*
SELECT is_storage_admin();
-- Expected: true (if you're a super_admin)
*/
