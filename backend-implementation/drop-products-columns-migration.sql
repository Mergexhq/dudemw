-- ================================================
-- DROP COLUMNS FROM PRODUCTS TABLE - SAFE MIGRATION
-- ================================================
-- This script safely removes original_price and global_stock columns
-- Execute this on your Supabase database
-- ================================================

-- Step 1: Check if columns exist before dropping
DO $$ 
BEGIN
    -- Check for original_price column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'original_price'
    ) THEN
        RAISE NOTICE 'Column original_price exists. Will be dropped.';
    ELSE
        RAISE NOTICE 'Column original_price does not exist. Skipping.';
    END IF;
    
    -- Check for global_stock column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'global_stock'
    ) THEN
        RAISE NOTICE 'Column global_stock exists. Will be dropped.';
    ELSE
        RAISE NOTICE 'Column global_stock does not exist. Skipping.';
    END IF;
END $$;

-- Step 2: Backup data (Optional - creates a backup table)
-- Uncomment if you want to keep a backup
-- CREATE TABLE products_backup_before_column_drop AS 
-- SELECT * FROM products;

-- Step 3: Drop the columns
-- Drop original_price column
ALTER TABLE products 
DROP COLUMN IF EXISTS original_price;

-- Drop global_stock column
ALTER TABLE products 
DROP COLUMN IF EXISTS global_stock;

-- Step 4: Verify the columns are dropped
DO $$ 
DECLARE
    original_price_exists BOOLEAN;
    global_stock_exists BOOLEAN;
BEGIN
    -- Check if original_price still exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'original_price'
    ) INTO original_price_exists;
    
    -- Check if global_stock still exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'global_stock'
    ) INTO global_stock_exists;
    
    IF NOT original_price_exists AND NOT global_stock_exists THEN
        RAISE NOTICE '✅ SUCCESS: Both columns have been successfully dropped!';
    ELSE
        IF original_price_exists THEN
            RAISE WARNING '⚠️ Column original_price still exists!';
        END IF;
        IF global_stock_exists THEN
            RAISE WARNING '⚠️ Column global_stock still exists!';
        END IF;
    END IF;
END $$;

-- Step 5: Show remaining columns in products table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
