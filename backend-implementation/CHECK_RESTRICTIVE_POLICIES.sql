-- ================================================
-- CHECK FOR RESTRICTIVE POLICIES
-- ================================================
-- Restrictive policies can block even if permissive ones allow
-- ================================================

SELECT 
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN permissive = 'RESTRICTIVE' THEN '❌ BLOCKING'
        ELSE '✅ ALLOWING'
    END as policy_type,
    definition
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY permissive DESC, policyname;

-- Explain the issue
DO $$ 
DECLARE
    restrictive_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO restrictive_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND permissive = 'RESTRICTIVE';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 POLICY TYPE ANALYSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF restrictive_count > 0 THEN
        RAISE NOTICE '❌ FOUND % RESTRICTIVE POLICIES!', restrictive_count;
        RAISE NOTICE '';
        RAISE NOTICE 'RESTRICTIVE policies can block uploads even if';
        RAISE NOTICE 'PERMISSIVE policies allow them.';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUTION:';
        RAISE NOTICE '   Run: /app/NUCLEAR_FIX_ALL_POLICIES.sql';
        RAISE NOTICE '   This will remove ALL policies and recreate clean ones.';
    ELSE
        RAISE NOTICE '✅ No restrictive policies found';
        RAISE NOTICE '   All policies are PERMISSIVE (good!)';
    END IF;
    
    RAISE NOTICE '';
    
END $$;
