-- ================================================
-- DATABASE VERIFICATION TEST SCRIPT
-- ================================================
-- Run this after executing all 5 SQL files to verify everything works
-- This script performs comprehensive checks on your database setup
-- ================================================

\echo '================================================'
\echo 'STARTING DATABASE VERIFICATION'
\echo '================================================'
\echo ''

-- ================================================
-- 1. CHECK TABLES CREATED
-- ================================================
\echo '1. Checking Tables...'

SELECT 
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 36 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 36 tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

\echo ''
\echo 'Table List:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''

-- ================================================
-- 2. CHECK INDEXES CREATED
-- ================================================
\echo '2. Checking Indexes...'

SELECT 
    COUNT(*) as total_indexes,
    CASE 
        WHEN COUNT(*) > 100 THEN '✅ PASS'
        ELSE '⚠️  WARNING - Expected 100+ indexes'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public';

\echo ''

-- ================================================
-- 3. CHECK RLS POLICIES CREATED
-- ================================================
\echo '3. Checking RLS Policies...'

SELECT 
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) > 80 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 80+ policies'
    END as status
FROM pg_policies 
WHERE schemaname = 'public';

\echo ''
\echo 'Policies per table:'
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- ================================================
-- 4. CHECK FUNCTIONS CREATED (THE FIX!)
-- ================================================
\echo '4. Checking Functions (Including Admin Functions)...'

SELECT 
    COUNT(*) as total_functions,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 10+ functions'
    END as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

\echo ''
\echo 'Critical Functions Check:'

-- Check if is_admin_user exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'is_admin_user' 
            AND pronamespace = 'public'::regnamespace
        ) THEN '✅ PASS - is_admin_user() exists'
        ELSE '❌ FAIL - is_admin_user() NOT FOUND'
    END as admin_function_status;

-- Check if is_owner_user exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'is_owner_user' 
            AND pronamespace = 'public'::regnamespace
        ) THEN '✅ PASS - is_owner_user() exists'
        ELSE '❌ FAIL - is_owner_user() NOT FOUND'
    END as owner_function_status;

\echo ''
\echo 'All Functions:'
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as returns,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

\echo ''

-- ================================================
-- 5. TEST ADMIN FUNCTION EXECUTION
-- ================================================
\echo '5. Testing Admin Function Execution...'

DO $$
BEGIN
    -- Try to execute the function
    IF is_admin_user() IS NOT NULL THEN
        RAISE NOTICE '✅ PASS - is_admin_user() executes without error';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAIL - is_admin_user() execution error: %', SQLERRM;
END $$;

-- Test direct function call
SELECT 
    is_admin_user() as am_i_admin,
    CASE 
        WHEN is_admin_user() IS NOT NULL THEN '✅ Function works!'
        ELSE '❌ Function error'
    END as status;

\echo ''

-- ================================================
-- 6. CHECK RLS ENABLED ON ALL TABLES
-- ================================================
\echo '6. Checking RLS is Enabled on All Tables...'

SELECT 
    COUNT(*) as tables_with_rls,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
        THEN '✅ PASS - RLS enabled on all tables'
        ELSE '❌ FAIL - Some tables missing RLS'
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
AND rowsecurity = true;

\echo ''
\echo 'Tables WITHOUT RLS (should be empty):'
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' 
AND rowsecurity = false;

\echo ''

-- ================================================
-- 7. CHECK TRIGGERS CREATED
-- ================================================
\echo '7. Checking Triggers...'

SELECT 
    COUNT(*) as total_triggers,
    CASE 
        WHEN COUNT(*) > 20 THEN '✅ PASS'
        ELSE '⚠️  WARNING - Expected 20+ triggers'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

\echo ''

-- ================================================
-- 8. VERIFY KEY TABLES STRUCTURE
-- ================================================
\echo '8. Verifying Key Tables Structure...'

-- Check products table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
        ) THEN '✅ products table exists'
        ELSE '❌ products table missing'
    END as products_check;

-- Check orders table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
        ) THEN '✅ orders table exists'
        ELSE '❌ orders table missing'
    END as orders_check;

-- Check tax_settings table (new)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'tax_settings'
        ) THEN '✅ tax_settings table exists (GST support)'
        ELSE '❌ tax_settings table missing'
    END as tax_check;

\echo ''

-- ================================================
-- 9. SUMMARY REPORT
-- ================================================
\echo '================================================'
\echo 'VERIFICATION SUMMARY'
\echo '================================================'

SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total RLS Policies',
    COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Functions',
    COUNT(*)::text
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
UNION ALL
SELECT 
    'Total Triggers',
    COUNT(*)::text
FROM information_schema.triggers
WHERE trigger_schema = 'public';

\echo ''
\echo '================================================'
\echo 'VERIFICATION COMPLETE!'
\echo '================================================'
\echo ''
\echo 'Next Steps:'
\echo '1. If all checks passed: Regenerate TypeScript types'
\echo '2. Create your first admin user in Supabase Auth'
\echo '3. Start building your e-commerce features!'
\echo ''
\echo 'To regenerate types:'
\echo '  npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts'
\echo ''
