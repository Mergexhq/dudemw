-- ================================================
-- VERIFY RLS ISSUE - Quick Diagnostic
-- ================================================
-- Run this to confirm where your role is stored
-- ================================================

DO $$ 
DECLARE
    v_user_id UUID := 'a703c06b-4739-4c16-8cd6-dd181eb677f9';
    meta_role TEXT;
    profile_role TEXT;
    has_admin_function BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 RLS ISSUE DIAGNOSTIC';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check auth.users metadata
    SELECT raw_user_meta_data->>'role' INTO meta_role
    FROM auth.users
    WHERE id = v_user_id;
    
    RAISE NOTICE '1. Role in auth.users.raw_user_meta_data:';
    RAISE NOTICE '   Value: %', COALESCE(meta_role, 'NULL (NOT SET)');
    
    IF meta_role IS NULL THEN
        RAISE NOTICE '   ❌ PROBLEM: Role is NOT in user metadata';
    ELSE
        RAISE NOTICE '   ✅ Role found in metadata';
    END IF;
    RAISE NOTICE '';
    
    -- Check admin_profiles table
    SELECT role INTO profile_role
    FROM admin_profiles
    WHERE admin_profiles.user_id = v_user_id;
    
    RAISE NOTICE '2. Role in admin_profiles table:';
    RAISE NOTICE '   Value: %', COALESCE(profile_role, 'NULL (NOT SET)');
    
    IF profile_role IS NOT NULL THEN
        RAISE NOTICE '   ✅ Role found in admin_profiles: %', profile_role;
    ELSE
        RAISE NOTICE '   ❌ PROBLEM: No admin profile found';
    END IF;
    RAISE NOTICE '';
    
    -- Check if is_storage_admin function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'is_storage_admin'
        AND n.nspname = 'public'
    ) INTO has_admin_function;
    
    RAISE NOTICE '3. is_storage_admin() function:';
    IF has_admin_function THEN
        RAISE NOTICE '   ✅ Function EXISTS';
    ELSE
        RAISE NOTICE '   ❌ Function DOES NOT EXIST';
    END IF;
    RAISE NOTICE '';
    
    -- Check current storage policies
    RAISE NOTICE '4. Current Storage Policies:';
    RAISE NOTICE '';
    
    FOR meta_role IN
        SELECT policyname || ' - ' || cmd || ' - ' || 
               CASE 
                   WHEN definition LIKE '%raw_user_meta_data%' THEN '❌ WRONG (checks metadata)'
                   WHEN definition LIKE '%is_storage_admin()%' THEN '✅ CORRECT (uses function)'
                   WHEN definition LIKE '%admin_profiles%' THEN '⚠️  RISKY (direct query)'
                   ELSE '❓ UNKNOWN'
               END as policy_info
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '   %', meta_role;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DIAGNOSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF meta_role IS NULL AND profile_role IS NOT NULL THEN
        RAISE NOTICE '❌ MISMATCH DETECTED!';
        RAISE NOTICE '';
        RAISE NOTICE 'Your role is in admin_profiles (%), but RLS', profile_role;
        RAISE NOTICE 'policies are checking raw_user_meta_data (NULL).';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUTION:';
        RAISE NOTICE '   Run: /app/RLS_FIX_CLEAN.sql';
        RAISE NOTICE '';
        RAISE NOTICE 'This will:';
        RAISE NOTICE '  1. Create is_storage_admin() function';
        RAISE NOTICE '  2. Update policies to check admin_profiles';
        RAISE NOTICE '  3. Fix the mismatch';
    ELSIF NOT has_admin_function THEN
        RAISE NOTICE '❌ FUNCTION MISSING!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUTION:';
        RAISE NOTICE '   Run: /app/RLS_FIX_CLEAN.sql';
    ELSE
        RAISE NOTICE '✅ Configuration looks correct!';
        RAISE NOTICE '';
        RAISE NOTICE 'If uploads still fail:';
        RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
        RAISE NOTICE '  2. Try incognito mode';
        RAISE NOTICE '  3. Check browser console for exact error';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
END $$;
