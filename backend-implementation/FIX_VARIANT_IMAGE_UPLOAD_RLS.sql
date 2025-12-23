-- ================================================
-- FIX VARIANT IMAGE UPLOAD - RLS POLICY UPDATE
-- ================================================
-- This script updates the storage RLS policies to work with admin_profiles table
-- instead of raw_user_meta_data
-- ================================================

-- ================================================
-- STEP 1: DROP EXISTING ADMIN POLICIES
-- ================================================

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update collections" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete collections" ON storage.objects;

-- ================================================
-- STEP 2: CREATE NEW POLICIES USING admin_profiles
-- ================================================

-- Product Images - Admin Upload (checks admin_profiles table)
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Product Images - Admin Update
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Product Images - Admin Delete
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Banners - Admin Upload
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners' 
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Banners - Admin Update
CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Banners - Admin Delete
CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Categories - Admin Upload
CREATE POLICY "Admins can upload categories"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Categories - Admin Update
CREATE POLICY "Admins can update categories"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Categories - Admin Delete
CREATE POLICY "Admins can delete categories"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Collections - Admin Upload
CREATE POLICY "Admins can upload collections"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'collections' 
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Collections - Admin Update
CREATE POLICY "Admins can update collections"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'collections'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- Collections - Admin Delete
CREATE POLICY "Admins can delete collections"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'collections'
  AND EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('staff', 'manager', 'admin', 'super_admin')
  )
);

-- ================================================
-- STEP 3: VERIFICATION
-- ================================================

DO $$ 
DECLARE
    policy_count INTEGER;
    admin_exists BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%Admins can%';
    
    -- Check if current user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND admin_profiles.is_active = true
    ) INTO admin_exists;
    
    -- Display results
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   VARIANT IMAGE UPLOAD FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Policies Updated: %', policy_count;
    RAISE NOTICE 'Current User is Admin: %', CASE WHEN admin_exists THEN 'YES ✅' ELSE 'NO ❌' END;
    RAISE NOTICE '';
    RAISE NOTICE 'What Changed:';
    RAISE NOTICE '  - Policies now check admin_profiles table';
    RAISE NOTICE '  - Instead of raw_user_meta_data role';
    RAISE NOTICE '  - All active admin roles can upload images';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions:';
    RAISE NOTICE '  - Staff, Manager, Admin, Super Admin can upload/update/delete';
    RAISE NOTICE '  - Public can view all images (unchanged)';
    RAISE NOTICE '';
    
    IF NOT admin_exists THEN
        RAISE NOTICE 'WARNING: Your user is not in admin_profiles table!';
        RAISE NOTICE 'Run this to check your admin status:';
        RAISE NOTICE '  SELECT * FROM admin_profiles WHERE user_id = auth.uid();';
        RAISE NOTICE '';
    END IF;
END $$;

-- Show current user's admin status
SELECT 
    ap.user_id,
    au.email,
    ap.role,
    ap.is_active,
    ap.approved_at
FROM public.admin_profiles ap
JOIN auth.users au ON au.id = ap.user_id
WHERE ap.user_id = auth.uid();

-- ================================================
-- TROUBLESHOOTING
-- ================================================
-- If you still can't upload, verify:

-- 1. Check if you're in admin_profiles:
-- SELECT * FROM admin_profiles WHERE user_id = auth.uid();

-- 2. Check if you're active:
-- SELECT is_active FROM admin_profiles WHERE user_id = auth.uid();

-- 3. Check current policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Test upload permission directly:
-- SELECT EXISTS (
--   SELECT 1 FROM public.admin_profiles
--   WHERE admin_profiles.user_id = auth.uid()
--   AND admin_profiles.is_active = true
-- );
