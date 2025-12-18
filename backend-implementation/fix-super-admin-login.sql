-- ================================================
-- FIX SUPER ADMIN LOGIN ISSUE
-- ================================================
-- This script updates the existing super admin to be active
-- Run this in Supabase SQL Editor
-- ================================================

-- Update super admin to be active
UPDATE admin_profiles
SET is_active = true
WHERE role = 'super_admin'
AND user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'mainfordudew@gmail.com'  -- Replace with your actual super admin email
);

-- Verify the update
SELECT 
  ap.id,
  ap.user_id,
  au.email,
  ap.role,
  ap.is_active,
  ap.approved_by,
  ap.approved_at,
  ap.created_at
FROM admin_profiles ap
JOIN auth.users au ON ap.user_id = au.id
WHERE ap.role = 'super_admin';

-- Expected result: is_active should be TRUE
