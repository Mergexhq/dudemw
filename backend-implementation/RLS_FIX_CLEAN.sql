-- ================================================
-- COMPLETE RLS FIX - CLEAN VERSION
-- ================================================

-- Drop ALL existing admin_profiles policies
DROP POLICY IF EXISTS "Users can view own admin profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admin profiles are viewable by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can view other admin profiles" ON admin_profiles;

-- Create SIMPLE policy - users can view their own profile
CREATE POLICY "Users can view own profile"
ON admin_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to check if user is admin (bypasses RLS)
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

-- Function to check if user is super admin
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

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON admin_profiles
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles"
ON admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Super admins can update profiles
CREATE POLICY "Super admins can update profiles"
ON admin_profiles
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
ON admin_profiles
FOR DELETE
TO authenticated
USING (is_super_admin());

-- Fix admin_settings policies
DROP POLICY IF EXISTS "Super admins can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update settings" ON admin_settings;
DROP POLICY IF EXISTS "Admin settings viewable by super admins" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;

CREATE POLICY "Anyone can view setup status"
ON admin_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Super admins can update settings"
ON admin_settings
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Drop old storage policies
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

-- Create storage policies for product-images
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

-- Create storage policies for categories
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

-- Create storage policies for avatars
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

-- Create storage policies for banners
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
