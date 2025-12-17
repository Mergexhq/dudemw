-- ================================================
-- ADMIN AUTHENTICATION SYSTEM - DATABASE SCHEMA
-- ================================================
-- This script creates tables for dual-auth system
-- Separates store users from admin users
-- ================================================

-- ================================================
-- ADMIN PROFILES TABLE
-- ================================================
-- Stores admin user information and authorization
-- Links to auth.users via user_id

CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'staff')),
    is_active BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES admin_profiles(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user_id links to Supabase auth
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_active ON admin_profiles(is_active);

-- ================================================
-- ADMIN SETTINGS TABLE (Single Row)
-- ================================================
-- Stores system-wide admin settings
-- Only one row should exist

CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setup_completed BOOLEAN DEFAULT FALSE,
    recovery_key_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    singleton_guard BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Ensure only one row exists via unique constraint on singleton_guard
    CONSTRAINT single_row_only UNIQUE (singleton_guard)
);

-- Insert initial row if not exists
INSERT INTO admin_settings (setup_completed, recovery_key_hash, singleton_guard)
SELECT FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin profiles are viewable by authenticated users" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can view other admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admin settings viewable by super admins" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;

-- Policy: Authenticated users can view their own admin profile
CREATE POLICY "Users can view own admin profile" ON admin_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Super admins can view all admin profiles
CREATE POLICY "Super admins can view all profiles" ON admin_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    );

-- Policy: Super admins can manage admin profiles
CREATE POLICY "Super admins can manage profiles" ON admin_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    );

-- Policy: Super admins can view admin settings
CREATE POLICY "Super admins can view settings" ON admin_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    );

-- Policy: Super admins can update admin settings
CREATE POLICY "Super admins can update settings" ON admin_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            WHERE ap.user_id = auth.uid() 
            AND ap.role = 'super_admin'
            AND ap.is_active = TRUE
        )
    );

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = user_uuid
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM admin_profiles
    WHERE user_id = user_uuid
    AND is_active = TRUE;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if setup is completed
CREATE OR REPLACE FUNCTION is_setup_completed()
RETURNS BOOLEAN AS $$
DECLARE
    completed BOOLEAN;
BEGIN
    SELECT setup_completed INTO completed
    FROM admin_settings
    LIMIT 1;
    
    RETURN COALESCE(completed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Admin authentication tables created successfully!';
    RAISE NOTICE '📊 Tables: admin_profiles, admin_settings';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '⚙️  Helper functions created';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Set ADMIN_SETUP_KEY in .env.local';
    RAISE NOTICE '   2. Visit /admin/setup to create super admin';
    RAISE NOTICE '   3. Save recovery key securely (shown only once)';
END $$;
