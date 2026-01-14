-- ================================================
-- Add Delivery Days Columns to System Preferences
-- Migration: Add min_delivery_days and max_delivery_days
-- ================================================

-- Add delivery days columns to system_preferences table
ALTER TABLE system_preferences 
ADD COLUMN IF NOT EXISTS min_delivery_days INTEGER,
ADD COLUMN IF NOT EXISTS max_delivery_days INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN system_preferences.min_delivery_days IS 'Minimum estimated delivery days from order placement';
COMMENT ON COLUMN system_preferences.max_delivery_days IS 'Maximum estimated delivery days from order placement';

-- Update existing records with default values (optional - can be left NULL)
-- UPDATE system_preferences 
-- SET min_delivery_days = 3, max_delivery_days = 7
-- WHERE min_delivery_days IS NULL AND max_delivery_days IS NULL;

-- Verification
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   ✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Added columns to system_preferences:';
    RAISE NOTICE '  ✅ min_delivery_days (INTEGER, nullable)';
    RAISE NOTICE '  ✅ max_delivery_days (INTEGER, nullable)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Set delivery days in Admin Settings UI';
    RAISE NOTICE '  2. Test checkout page delivery estimation';
    RAISE NOTICE '';
END $$;
