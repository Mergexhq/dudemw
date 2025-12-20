-- ================================================
-- FIX RLS POLICIES FOR CATEGORIES
-- ================================================
-- This script fixes RLS policy issues preventing category creation
-- Run this in Supabase SQL Editor if you're still getting RLS errors
-- ================================================

-- Option 1: Check if the is_admin_user function exists and works
-- Run this to test:
SELECT is_admin_user();

-- If it returns an error, the function doesn't exist or has issues
-- If it returns false, your user doesn't have admin role set

-- ================================================
-- OPTION A: Temporarily disable RLS (FOR TESTING ONLY)
-- ================================================
-- ⚠️ WARNING: This removes security. Use only for testing!
-- ⚠️ Re-enable RLS after confirming it works!

-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Test category creation, then re-enable with:
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ================================================
-- OPTION B: Add a permissive policy for service role
-- ================================================
-- This allows the service role key to bypass RLS while keeping security

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins have full access to categories" ON categories;

-- Create new policies that work with service role
CREATE POLICY "Service role has full access to categories"
    ON categories FOR ALL
    TO authenticated
    USING (
        -- Allow if using service role (bypasses this check anyway)
        -- OR if user is admin
        is_admin_user() OR 
        auth.jwt()->>'role' = 'service_role'
    )
    WITH CHECK (
        is_admin_user() OR 
        auth.jwt()->>'role' = 'service_role'
    );

-- Public can still read
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

-- ================================================
-- OPTION C: Check and fix admin role for your user
-- ================================================
-- This ensures your user account has admin privileges

-- First, find your user ID (replace with your email)
-- SELECT id, email, raw_user_meta_data 
-- FROM auth.users 
-- WHERE email = 'your-email@example.com';

-- Then set admin role (replace USER_ID with your actual user ID)
-- UPDATE auth.users 
-- SET raw_user_meta_data = 
--     COALESCE(raw_user_meta_data, '{}'::jsonb) || 
--     '{"role": "admin"}'::jsonb
-- WHERE id = 'USER_ID';

-- ================================================
-- OPTION D: Most Permissive (Recommended for Development)
-- ================================================
-- This allows authenticated users to manage categories
-- Good for development, tighten for production

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ================================================
-- Verify policies are working
-- ================================================

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- Test insert (should work now)
-- INSERT INTO categories (name, slug, description, status)
-- VALUES ('Test Category', 'test-category', 'Test description', 'active')
-- RETURNING *;

-- Clean up test
-- DELETE FROM categories WHERE slug = 'test-category';

-- ================================================
-- RECOMMENDED SOLUTION
-- ================================================
-- For development: Use OPTION D (authenticated users)
-- For production: Use OPTION B (service role + admin check)
-- 
-- After applying fix, restart your Next.js dev server:
-- npm run dev (or yarn dev, or your start command)
