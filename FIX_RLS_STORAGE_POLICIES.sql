-- ================================================
-- FIX RLS STORAGE POLICIES FOR IMAGE UPLOADS
-- ================================================
-- This script will:
-- 1. Verify your admin role is set correctly
-- 2. Recreate all storage RLS policies
-- 3. Verify the setup
-- ================================================

-- ================================================
-- STEP 1: VERIFY ADMIN ROLE
-- ================================================
DO $$ 
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    SELECT 
        email,
        raw_user_meta_data->>'role'
    INTO user_email, user_role
    FROM auth.users
    WHERE email = 'mainfordudemw@gmail.com';
    
    IF user_role IN ('admin', 'owner') THEN
        RAISE NOTICE '✅ User % has role: %', user_email, user_role;
    ELSE
        RAISE NOTICE '❌ User % does NOT have admin role. Current role: %', user_email, COALESCE(user_role, 'NULL');
        RAISE NOTICE '⚠️  Setting admin role now...';
        
        -- Set admin role
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE email = 'mainfordudemw@gmail.com';
        
        RAISE NOTICE '✅ Admin role set successfully!';
    END IF;
END $$;

-- ================================================
-- STEP 2: ENSURE BUCKETS EXIST
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
-- STEP 3: DROP ALL EXISTING POLICIES
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

-- Product Images: Allow authenticated admin users to upload (INSERT)
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Product Images: Allow authenticated admin users to update
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Product Images: Allow authenticated admin users to delete
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Product Images: Allow everyone to view (Public access)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ================================================
-- STEP 5: CREATE NEW RLS POLICIES - CATEGORIES
-- ================================================

-- Categories: Allow authenticated admin users to upload (INSERT)
CREATE POLICY "Admins can upload categories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'categories' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Categories: Allow authenticated admin users to update
CREATE POLICY "Admins can update categories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Categories: Allow authenticated admin users to delete
CREATE POLICY "Admins can delete categories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'categories'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
);

-- Categories: Allow everyone to view (Public access)
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
    user_role TEXT;
    user_email TEXT;
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
    
    -- Get user role
    SELECT 
        email,
        raw_user_meta_data->>'role'
    INTO user_email, user_role
    FROM auth.users
    WHERE email = 'mainfordudemw@gmail.com';
    
    -- Display results
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS POLICIES SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'User Configuration:';
    RAISE NOTICE '  Email: %', user_email;
    RAISE NOTICE '  Role: %', user_role;
    RAISE NOTICE '';
    RAISE NOTICE 'Storage Policies Created:';
    RAISE NOTICE '  Product Images: % policies', product_policies;
    RAISE NOTICE '  Categories: % policies', category_policies;
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Log out from your admin dashboard';
    RAISE NOTICE '  2. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '  3. Log back in with: %', user_email;
    RAISE NOTICE '  4. Try uploading images again';
    RAISE NOTICE '';
    RAISE NOTICE 'If still not working, check:';
    RAISE NOTICE '  - Browser console for detailed errors';
    RAISE NOTICE '  - Supabase Dashboard > Storage > Policies';
    RAISE NOTICE '  - Make sure you are logged in as: %', user_email;
    RAISE NOTICE '';
END $$;

-- ================================================
-- STEP 7: TEST QUERY (Run this AFTER logging back in)
-- ================================================
-- Uncomment and run this query after logging back in to verify your session:
/*
SELECT 
    auth.uid() as current_user_id,
    u.email,
    u.raw_user_meta_data->>'role' as user_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' IN ('admin', 'owner') THEN '✅ CAN UPLOAD'
        ELSE '❌ CANNOT UPLOAD'
    END as upload_permission
FROM auth.users u
WHERE u.id = auth.uid();
*/
