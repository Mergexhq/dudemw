-- ================================================
-- NUCLEAR OPTION: DROP ALL STORAGE POLICIES AND RECREATE
-- ================================================
-- This removes ALL storage policies and creates clean ones
-- Use this if there are conflicting policies
-- ================================================

-- Step 1: Drop ALL existing storage policies
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    RAISE NOTICE 'Dropping all storage policies...';
    
    FOR policy_name IN
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
        RAISE NOTICE 'Dropped: %', policy_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ All old policies removed';
    RAISE NOTICE '';
END $$;

-- Step 2: Ensure is_storage_admin() function exists
CREATE OR REPLACE FUNCTION is_storage_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    ) INTO admin_exists;
    
    RETURN COALESCE(admin_exists, FALSE);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create clean policies for ALL buckets

-- ============================================
-- PRODUCT-IMAGES BUCKET
-- ============================================
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND is_storage_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND is_storage_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND is_storage_admin());

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

-- ============================================
-- CATEGORIES BUCKET
-- ============================================
CREATE POLICY "Admins can upload categories"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'categories' AND is_storage_admin());

CREATE POLICY "Admins can update categories"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'categories' AND is_storage_admin());

CREATE POLICY "Admins can delete categories"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'categories' AND is_storage_admin());

CREATE POLICY "Anyone can view categories"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'categories');

-- ============================================
-- BANNERS BUCKET
-- ============================================
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banners' AND is_storage_admin());

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'banners' AND is_storage_admin());

CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banners' AND is_storage_admin());

CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'banners');

-- ============================================
-- COLLECTIONS BUCKET
-- ============================================
CREATE POLICY "Admins can upload collections"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'collections' AND is_storage_admin());

CREATE POLICY "Admins can update collections"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'collections' AND is_storage_admin());

CREATE POLICY "Admins can delete collections"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'collections' AND is_storage_admin());

CREATE POLICY "Anyone can view collections"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'collections');

-- ============================================
-- AVATARS BUCKET
-- ============================================
CREATE POLICY "Admins can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND is_storage_admin());

CREATE POLICY "Admins can update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND is_storage_admin());

CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND is_storage_admin());

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Step 4: Verify
DO $$ 
DECLARE
    total_policies INTEGER;
    product_policies INTEGER;
    category_policies INTEGER;
    banner_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects';
    
    SELECT COUNT(*) INTO product_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%product%';
    
    SELECT COUNT(*) INTO category_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%categor%';
    
    SELECT COUNT(*) INTO banner_policies
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%banner%';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ STORAGE POLICIES RECREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total policies: %', total_policies;
    RAISE NOTICE '  Product-images: %', product_policies;
    RAISE NOTICE '  Categories: %', category_policies;
    RAISE NOTICE '  Banners: %', banner_policies;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  CRITICAL: Log out and clear cache NOW!';
    RAISE NOTICE '   1. Log out from admin dashboard';
    RAISE NOTICE '   2. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '   3. Close ALL browser tabs';
    RAISE NOTICE '   4. Log back in';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Then test uploads in Categories and Variants';
    RAISE NOTICE '';
END $$;
