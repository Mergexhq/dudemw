-- ================================================
-- DIAGNOSE POLICY CONFLICTS
-- ================================================
-- This will show ALL policies on storage.objects
-- to find conflicts or missing policies
-- ================================================

-- Show all storage policies with details
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- Count policies per bucket
DO $$ 
DECLARE
    policy_record RECORD;
    bucket_name TEXT;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 STORAGE POLICIES BY BUCKET';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check product-images policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (policyname LIKE '%product%' OR definition LIKE '%product-images%');
    RAISE NOTICE 'product-images bucket: % policies', policy_count;
    
    -- Check categories policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (policyname LIKE '%categor%' OR definition LIKE '%categories%');
    RAISE NOTICE 'categories bucket: % policies', policy_count;
    
    -- Check banners policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (policyname LIKE '%banner%' OR definition LIKE '%banners%');
    RAISE NOTICE 'banners bucket: % policies', policy_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 CHECKING POLICY DEFINITIONS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Show what each policy actually checks
    FOR policy_record IN
        SELECT policyname, cmd, definition
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND (policyname LIKE '%categor%' OR policyname LIKE '%product%')
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: %', policy_record.policyname;
        RAISE NOTICE '  Command: %', policy_record.cmd;
        RAISE NOTICE '  Definition: %', policy_record.definition;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 TESTING is_storage_admin() FUNCTION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Test the function
    BEGIN
        EXECUTE 'SELECT is_storage_admin()' INTO policy_count;
        RAISE NOTICE '✅ is_storage_admin() returns: %', policy_count;
        
        IF policy_count THEN
            RAISE NOTICE '   You SHOULD be able to upload';
        ELSE
            RAISE NOTICE '   ❌ Function returns FALSE - cannot upload';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR calling is_storage_admin(): %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    
END $$;
