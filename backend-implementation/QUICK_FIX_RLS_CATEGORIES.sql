-- ================================================
-- QUICK FIX: Allow Authenticated Users to Manage Categories
-- ================================================
-- This fixes the RLS policy error when creating categories
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: Remove the old restrictive admin-only policy
DROP POLICY IF EXISTS "Admins have full access to categories" ON categories;

-- Step 2: Add a new policy that allows authenticated users to manage categories
CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 3: Ensure public can still read categories
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

-- Step 4: Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- ================================================
-- Success! You should now be able to create categories
-- ================================================
-- After running this:
-- 1. Go back to your app
-- 2. Try creating a category again
-- 3. It should work now!
-- ================================================

-- Optional: Test the policy with a sample insert
-- INSERT INTO categories (name, slug, description, status)
-- VALUES ('Test Category', 'test-category-123', 'Test description', 'active')
-- RETURNING *;

-- Clean up test (uncomment if you ran the test)
-- DELETE FROM categories WHERE slug = 'test-category-123';
