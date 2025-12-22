-- ================================================
-- FINAL COMPLETE FIX FOR INFINITE RECURSION
-- ================================================
-- This fixes BOTH storage policies AND admin_profiles policies
-- ================================================

-- ================================================
-- STEP 1: FIX ADMIN_PROFILES RLS POLICIES
-- ================================================
-- These policies were causing recursion by checking admin_profiles within admin_profiles policies!

-- Drop ALL existing admin_profiles policies
DROP POLICY IF EXISTS "Users can view own admin profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admin profiles are viewable by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can view other admin profiles" ON admin_profiles;

-- Create SIMPLE policies that don't cause recursion
-- Policy 1: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
ON admin_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Service role can do everything (for backend operations)
-- No explicit policy needed - service_role bypasses RLS

-- ================================================
-- STEP 2: CREATE SECURITY DEFINER FUNCTIONS
-- ================================================

-- Function to check if user is admin (for storage policies)
CREATE OR REPLACE FUNCTION is_storage_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
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

-- Function to check if user can manage other admins
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    ) INTO is_super;
    
    RETURN COALESCE(is_super, FALSE);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 3: ADD POLICIES FOR SUPER ADMINS TO MANAGE PROFILES
-- ================================================
-- Now super admins can manage other profiles using the SECURITY DEFINER function

CREATE POLICY "Super admins can view all profiles"
ON admin_profiles
FOR SELECT
TO authenticated
USING (is_super_admin());

CREATE POLICY "Super admins can insert profiles"
ON admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update profiles"
ON admin_profiles
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete profiles"
ON admin_profiles
FOR DELETE
TO authenticated
USING (is_super_admin());

-- ================================================
-- STEP 4: FIX ADMIN_SETTINGS RLS POLICIES
-- ================================================

DROP POLICY IF EXISTS "Super admins can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update settings" ON admin_settings;
DROP POLICY IF EXISTS "Admin settings viewable by super admins" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;

-- Anyone can view setup status (needed for /admin/setup page)
CREATE POLICY "Anyone can view setup status"
ON admin_settings
FOR SELECT
TO public
USING (true);

-- Super admins can update settings
CREATE POLICY "Super admins can update settings"
ON admin_settings
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- ================================================
-- STEP 5: DROP ALL OLD STORAGE POLICIES
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
-- STEP 6: CREATE NEW STORAGE POLICIES
-- ================================================
-- Using SECURITY DEFINER function to prevent recursion

-- PRODUCT IMAGES BUCKET
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

-- CATEGORIES BUCKET
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

-- AVATARS BUCKET
CREATE POLICY "Admins can upload to avatars"
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

-- BANNERS BUCKET
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

-- ================================================
-- STEP 7: VERIFICATION
-- ================================================

DO $$ 
DECLARE
    admin_policies INTEGER;
    storage_policies INTEGER;
    functions_count INTEGER;
    current_user_email TEXT;
    has_profile BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO admin_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_profiles';
    
    SELECT COUNT(*) INTO storage_policies
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc
    WHERE proname IN ('is_storage_admin', 'is_super_admin');
    
    -- Check if current user has profile
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO current_user_email
        FROM auth.users WHERE id = auth.uid();
        
        SELECT EXISTS (
            SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
        ) INTO has_profile;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMPLETE FIX APPLIED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies Created:';
    RAISE NOTICE '  - admin_profiles: % policies', admin_policies;
    RAISE NOTICE '  - storage.objects: % policies', storage_policies;
    RAISE NOTICE '  - SECURITY DEFINER functions: %', functions_count;
    RAISE NOTICE '';
    
    IF current_user_email IS NOT NULL THEN
        RAISE NOTICE 'Current User: %', current_user_email;
        IF has_profile THEN
            RAISE NOTICE '  ✅ Has admin profile';
        ELSE
            RAISE NOTICE '  ⚠️  NO ADMIN PROFILE!';
            RAISE NOTICE '  Action Required: Visit /admin/setup to create profile';
        END IF;
    ELSE
        RAISE NOTICE 'Not logged in - log in to check your profile';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. If you see "NO ADMIN PROFILE" above:';
    RAISE NOTICE '     → Visit http://localhost:3000/admin/setup';
    RAISE NOTICE '     → Create your super admin account';
    RAISE NOTICE '  2. Log out completely';
    RAISE NOTICE '  3. Clear browser cache';
    RAISE NOTICE '  4. Log back in';
    RAISE NOTICE '  5. Test upload';
    RAISE NOTICE '';
END $$;
