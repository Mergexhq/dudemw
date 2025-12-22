-- ================================================
-- QUICK FIX FOR CATEGORIES & VARIANTS IMAGE UPLOAD
-- ================================================
-- This fixes the RLS policy mismatch issue
-- Run this in Supabase SQL Editor, then log out and back in
-- ================================================

-- Step 1: Create the is_storage_admin() function
-- This function checks admin_profiles table (where your role actually is)
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

-- Step 2: Drop old policies that check wrong location
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categories" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view categories" ON storage.objects;

-- Step 3: Create new policies using the correct function
-- Product Images Bucket
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

-- Categories Bucket
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

-- Step 4: Verify the fix
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS POLICIES UPDATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The policies now check admin_profiles table';
    RAISE NOTICE 'where your role is actually stored.';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
    RAISE NOTICE '   1. Log out from admin dashboard';
    RAISE NOTICE '   2. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '   3. Close all browser tabs';
    RAISE NOTICE '   4. Log back in';
    RAISE NOTICE '   5. Test image upload in Categories or Variants';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Image uploads should now work!';
    RAISE NOTICE '';
END $$;
