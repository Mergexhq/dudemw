-- ================================================
-- FIX STORAGE RLS POLICIES FOR ADMIN_PROFILES SYSTEM
-- ================================================
-- Your super admin is authenticated via Supabase Auth
-- BUT the role is stored in admin_profiles table (not raw_user_meta_data)
-- The old RLS policies were checking the wrong place!
-- ================================================

-- ================================================
-- STEP 1: VERIFY YOUR ADMIN PROFILE
-- ================================================
DO $$ 
DECLARE
    profile_exists BOOLEAN;
    profile_role TEXT;
    profile_active BOOLEAN;
BEGIN
    SELECT 
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            JOIN auth.users u ON u.id = ap.user_id
            WHERE u.email = 'mainfordudemw@gmail.com'
        ),
        ap.role,
        ap.is_active
    INTO profile_exists, profile_role, profile_active
    FROM admin_profiles ap
    JOIN auth.users u ON u.id = ap.user_id
    WHERE u.email = 'mainfordudemw@gmail.com';
    
    IF profile_exists THEN
        RAISE NOTICE '✅ Admin profile found for mainfordudemw@gmail.com';
        RAISE NOTICE '   Role: %', profile_role;
        RAISE NOTICE '   Active: %', profile_active;
    ELSE
        RAISE NOTICE '❌ No admin profile found for mainfordudemw@gmail.com';
        RAISE NOTICE '⚠️  This user needs to be created via /admin/setup page';
    END IF;
END $$;

-- ================================================
-- STEP 2: ENSURE STORAGE BUCKETS EXIST
-- ================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ================================================
-- STEP 3: DROP ALL OLD STORAGE POLICIES
-- ================================================
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view categories" ON storage.objects;

-- ================================================
-- STEP 4: CREATE NEW RLS POLICIES - PRODUCT IMAGES
-- ================================================
-- These policies check admin_profiles table (not user metadata!)

-- Policy: Admin users (from admin_profiles) can upload to product-images
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Admin users can update product images
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Admin users can delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Anyone can view product images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ================================================
-- STEP 5: CREATE NEW RLS POLICIES - CATEGORIES
-- ================================================

-- Policy: Admin users can upload to categories
CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Admin users can update categories
CREATE POLICY "Admins can update categories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Admin users can delete categories
CREATE POLICY "Admins can delete categories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Policy: Anyone can view categories (public bucket)
CREATE POLICY "Anyone can view categories"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'categories');

-- ================================================
-- STEP 6: VERIFICATION
-- ================================================
DO $$ 
DECLARE
    product_policies INTEGER;
    category_policies INTEGER;
    admin_user_id UUID;
    admin_email TEXT;
    admin_role TEXT;
    admin_active BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO product_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%product images%';
    
    SELECT COUNT(*) INTO category_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%categories%';
    
    -- Get admin info
    SELECT 
        u.id,
        u.email,
        ap.role,
        ap.is_active
    INTO admin_user_id, admin_email, admin_role, admin_active
    FROM auth.users u
    JOIN admin_profiles ap ON ap.user_id = u.id
    WHERE u.email = 'mainfordudemw@gmail.com';
    
    -- Display results
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ STORAGE RLS POLICIES FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Configuration:';
    RAISE NOTICE '  Email: %', admin_email;
    RAISE NOTICE '  Role: %', admin_role;
    RAISE NOTICE '  Active: %', admin_active;
    RAISE NOTICE '  User ID: %', admin_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Storage Policies Created:';
    RAISE NOTICE '  Product Images: % policies', product_policies;
    RAISE NOTICE '  Categories: % policies', category_policies;
    RAISE NOTICE '';
    RAISE NOTICE 'Key Changes:';
    RAISE NOTICE '  ✅ Policies now check admin_profiles table';
    RAISE NOTICE '  ✅ No longer checking raw_user_meta_data';
    RAISE NOTICE '  ✅ Works with your super_admin system';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Close ALL browser tabs';
    RAISE NOTICE '  2. Clear browser cache completely';
    RAISE NOTICE '  3. Log out and log back in';
    RAISE NOTICE '  4. Try uploading images';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Result: ✅ Images upload successfully!';
    RAISE NOTICE '';
END $$;

-- ================================================
-- STEP 7: CREATE HELPER FUNCTION FOR DEBUGGING
-- ================================================

-- Function to check if current user can upload
CREATE OR REPLACE FUNCTION can_user_upload_to_storage()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    has_admin_profile BOOLEAN,
    admin_role TEXT,
    is_active BOOLEAN,
    can_upload BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        u.email as user_email,
        (ap.id IS NOT NULL) as has_admin_profile,
        ap.role as admin_role,
        COALESCE(ap.is_active, false) as is_active,
        (ap.is_active = true AND ap.role IN ('super_admin', 'admin', 'manager')) as can_upload
    FROM auth.users u
    LEFT JOIN admin_profiles ap ON ap.user_id = u.id
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TESTING QUERY (Run after logging in)
-- ================================================
-- Uncomment and run this query AFTER you log back in:
/*
SELECT * FROM can_user_upload_to_storage();
-- Expected result:
-- can_upload = true
*/
