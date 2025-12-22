-- ================================================
-- COMPREHENSIVE DIAGNOSTICS FOR STORAGE UPLOAD ISSUES
-- ================================================
-- Run this script to diagnose all potential problems
-- ================================================

DO $$ 
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    has_admin_profile BOOLEAN;
    admin_role TEXT;
    admin_active BOOLEAN;
    function_exists BOOLEAN;
    function_result BOOLEAN;
    storage_policies_count INTEGER;
    admin_policies_count INTEGER;
    recursion_risk BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 STORAGE UPLOAD DIAGNOSTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 1: Current User
    -- ================================================
    RAISE NOTICE '📋 CHECK 1: Current User';
    RAISE NOTICE '----------------------------------------';
    
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '❌ NOT LOGGED IN';
        RAISE NOTICE '   Solution: Log in to your admin dashboard first';
        RAISE NOTICE '';
        RETURN;
    END IF;
    
    SELECT email INTO current_user_email
    FROM auth.users
    WHERE id = current_user_id;
    
    RAISE NOTICE '✅ Logged in';
    RAISE NOTICE '   User ID: %', current_user_id;
    RAISE NOTICE '   Email: %', current_user_email;
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 2: Admin Profile
    -- ================================================
    RAISE NOTICE '📋 CHECK 2: Admin Profile';
    RAISE NOTICE '----------------------------------------';
    
    SELECT 
        EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = current_user_id),
        COALESCE(ap.role, 'NONE'),
        COALESCE(ap.is_active, FALSE)
    INTO has_admin_profile, admin_role, admin_active
    FROM admin_profiles ap
    WHERE ap.user_id = current_user_id;
    
    IF NOT has_admin_profile THEN
        RAISE NOTICE '❌ No admin profile found';
        RAISE NOTICE '   Solution: Create admin via /admin/setup page';
        RAISE NOTICE '';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Admin profile exists';
    RAISE NOTICE '   Role: %', admin_role;
    RAISE NOTICE '   Active: %', admin_active;
    
    IF NOT admin_active THEN
        RAISE NOTICE '   ⚠️  WARNING: Profile is INACTIVE';
    END IF;
    
    IF admin_role NOT IN ('super_admin', 'admin', 'manager') THEN
        RAISE NOTICE '   ⚠️  WARNING: Role % cannot upload', admin_role;
    END IF;
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 3: is_storage_admin() Function
    -- ================================================
    RAISE NOTICE '📋 CHECK 3: is_storage_admin() Function';
    RAISE NOTICE '----------------------------------------';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'is_storage_admin'
        AND n.nspname = 'public'
    ) INTO function_exists;
    
    IF NOT function_exists THEN
        RAISE NOTICE '❌ Function is_storage_admin() does NOT exist';
        RAISE NOTICE '   This will cause infinite recursion!';
        RAISE NOTICE '   Solution: Run FIX_INFINITE_RECURSION_STORAGE_RLS.sql';
        RAISE NOTICE '';
        recursion_risk := TRUE;
    ELSE
        RAISE NOTICE '✅ Function is_storage_admin() exists';
        
        -- Check if it's SECURITY DEFINER
        SELECT EXISTS (
            SELECT 1 FROM pg_proc p
            WHERE p.proname = 'is_storage_admin'
            AND p.prosecdef = TRUE
        ) INTO function_exists;
        
        IF function_exists THEN
            RAISE NOTICE '   ✅ Function is SECURITY DEFINER (correct)';
        ELSE
            RAISE NOTICE '   ⚠️  WARNING: Function is NOT SECURITY DEFINER';
            RAISE NOTICE '   This may cause permission issues';
        END IF;
        
        -- Try to call the function
        BEGIN
            EXECUTE 'SELECT is_storage_admin()' INTO function_result;
            RAISE NOTICE '   ✅ Function callable';
            RAISE NOTICE '   Result: %', function_result;
            
            IF function_result THEN
                RAISE NOTICE '   ✅ You have upload permissions!';
            ELSE
                RAISE NOTICE '   ❌ Function returned FALSE - no upload permissions';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '   ❌ Error calling function: %', SQLERRM;
        END;
    END IF;
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 4: Storage Policies
    -- ================================================
    RAISE NOTICE '📋 CHECK 4: Storage RLS Policies';
    RAISE NOTICE '----------------------------------------';
    
    SELECT COUNT(*) INTO storage_policies_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects';
    
    RAISE NOTICE 'Total storage policies: %', storage_policies_count;
    
    IF storage_policies_count = 0 THEN
        RAISE NOTICE '   ❌ No storage policies found!';
        RAISE NOTICE '   Solution: Run FIX_INFINITE_RECURSION_STORAGE_RLS.sql';
    ELSE
        RAISE NOTICE '   ✅ Storage policies exist';
        
        -- Check for dangerous patterns (direct admin_profiles queries)
        SELECT COUNT(*) INTO admin_policies_count
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND definition LIKE '%FROM admin_profiles%';
        
        IF admin_policies_count > 0 THEN
            RAISE NOTICE '   ⚠️  WARNING: % policies directly query admin_profiles', admin_policies_count;
            RAISE NOTICE '   This can cause infinite recursion!';
            RAISE NOTICE '   Solution: Update policies to use is_storage_admin()';
            recursion_risk := TRUE;
        ELSE
            RAISE NOTICE '   ✅ No direct admin_profiles queries (good)';
        END IF;
        
        -- List policy names
        RAISE NOTICE '';
        RAISE NOTICE '   Policy names:';
        FOR admin_role IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            ORDER BY policyname
        LOOP
            RAISE NOTICE '     - %', admin_role;
        END LOOP;
    END IF;
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 5: Admin Profiles RLS
    -- ================================================
    RAISE NOTICE '📋 CHECK 5: Admin Profiles RLS';
    RAISE NOTICE '----------------------------------------';
    
    SELECT COUNT(*) INTO admin_policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'admin_profiles';
    
    RAISE NOTICE 'Total admin_profiles policies: %', admin_policies_count;
    
    IF admin_policies_count > 0 THEN
        -- Check for self-referencing policies
        SELECT COUNT(*) INTO storage_policies_count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'admin_profiles'
        AND definition LIKE '%FROM admin_profiles%';
        
        IF storage_policies_count > 0 THEN
            RAISE NOTICE '   ⚠️  % policies reference admin_profiles table', storage_policies_count;
            RAISE NOTICE '   Combined with storage policies, this causes recursion';
            recursion_risk := TRUE;
        ELSE
            RAISE NOTICE '   ✅ Policies don''t self-reference';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ================================================
    -- CHECK 6: Storage Buckets
    -- ================================================
    RAISE NOTICE '📋 CHECK 6: Storage Buckets';
    RAISE NOTICE '----------------------------------------';
    
    FOR admin_role IN 
        SELECT id, public, file_size_limit/1048576 as size_mb
        FROM storage.buckets
        WHERE id IN ('categories', 'product-images', 'avatars', 'banners')
        ORDER BY id
    LOOP
        RAISE NOTICE '   ✅ Bucket: %', admin_role;
    END LOOP;
    RAISE NOTICE '';

    -- ================================================
    -- FINAL SUMMARY
    -- ================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF recursion_risk THEN
        RAISE NOTICE '❌ INFINITE RECURSION RISK DETECTED!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Required Actions:';
        RAISE NOTICE '   1. Run: /app/FIX_INFINITE_RECURSION_STORAGE_RLS.sql';
        RAISE NOTICE '   2. This creates is_storage_admin() SECURITY DEFINER function';
        RAISE NOTICE '   3. Updates all storage policies to use the safe function';
        RAISE NOTICE '   4. Log out, clear cache, log back in';
        RAISE NOTICE '   5. Test upload';
    ELSIF NOT has_admin_profile THEN
        RAISE NOTICE '❌ NO ADMIN PROFILE';
        RAISE NOTICE '   Visit /admin/setup to create super admin';
    ELSIF NOT admin_active THEN
        RAISE NOTICE '❌ ADMIN PROFILE INACTIVE';
        RAISE NOTICE '   Contact super admin to activate your account';
    ELSIF admin_role NOT IN ('super_admin', 'admin', 'manager') THEN
        RAISE NOTICE '❌ INSUFFICIENT PERMISSIONS';
        RAISE NOTICE '   Your role: %', admin_role;
        RAISE NOTICE '   Required: super_admin, admin, or manager';
    ELSIF NOT function_exists THEN
        RAISE NOTICE '⚠️  FUNCTION MISSING';
        RAISE NOTICE '   Run: /app/FIX_INFINITE_RECURSION_STORAGE_RLS.sql';
    ELSIF function_result THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED!';
        RAISE NOTICE '';
        RAISE NOTICE '🎉 You should be able to upload files';
        RAISE NOTICE '';
        RAISE NOTICE 'If uploads still fail:';
        RAISE NOTICE '   1. Check browser console for errors';
        RAISE NOTICE '   2. Log out and clear browser cache';
        RAISE NOTICE '   3. Log back in';
        RAISE NOTICE '   4. Visit /admin/auth-debug for detailed status';
    ELSE
        RAISE NOTICE '❌ FUNCTION RETURNS FALSE';
        RAISE NOTICE '   is_storage_admin() exists but returns false';
        RAISE NOTICE '   Check admin profile status above';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
END $$;
