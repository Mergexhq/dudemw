-- ================================================
-- FIX CATEGORIES TABLE RLS POLICIES
-- ================================================
-- This fixes the 406/400 errors when creating categories
-- ================================================

-- Step 1: Check current RLS status
DO $$ 
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled on categories table
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'categories';
    
    -- Count policies on categories table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'categories';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 CATEGORIES TABLE RLS STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Enabled: %', rls_enabled;
    RAISE NOTICE 'Policy Count: %', policy_count;
    RAISE NOTICE '';
    
    IF rls_enabled AND policy_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM: RLS enabled but NO policies!';
        RAISE NOTICE '   This blocks ALL access including service role.';
    ELSIF NOT rls_enabled THEN
        RAISE NOTICE '✅ RLS disabled - all authenticated users can access';
    ELSE
        RAISE NOTICE '✅ RLS enabled with % policies', policy_count;
    END IF;
    
    RAISE NOTICE '';
END $$;

-- Step 2: Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can create categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

-- Step 3: Enable RLS on categories table (if not already)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies that allow admin operations
-- Allow admins to view all categories
CREATE POLICY "Admins can view categories"
ON categories FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    )
);

-- Allow admins to create categories
CREATE POLICY "Admins can create categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    )
);

-- Allow admins to update categories
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    )
);

-- Allow admins to delete categories
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE admin_profiles.user_id = auth.uid()
        AND is_active = true
        AND role IN ('super_admin', 'admin', 'manager')
    )
);

-- Allow public to view active categories (for store frontend)
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
TO anon
USING (status = 'active');

-- Step 5: Verify
DO $$ 
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'categories';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CATEGORIES TABLE RLS FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total policies: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Admins can now:';
    RAISE NOTICE '   - View all categories';
    RAISE NOTICE '   - Create categories';
    RAISE NOTICE '   - Update categories';
    RAISE NOTICE '   - Delete categories';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Public users can:';
    RAISE NOTICE '   - View active categories only';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Refresh browser and try again!';
    RAISE NOTICE '';
END $$;
