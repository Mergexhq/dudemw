-- ================================================
-- DROP EXISTING DATABASE OBJECTS
-- ================================================
-- This script removes all existing tables, indexes, policies, and functions
-- Execute this FIRST to ensure a clean database state
-- ================================================

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- ================================================
-- DROP ALL RLS POLICIES
-- ================================================
-- Drop policies on all tables (policies prevent table drops)

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ================================================
-- DROP ALL INDEXES
-- ================================================
-- Drop custom indexes (this is safe, indexes will be recreated)

DROP INDEX IF EXISTS idx_products_is_featured CASCADE;
DROP INDEX IF EXISTS idx_products_is_on_sale CASCADE;
DROP INDEX IF EXISTS idx_products_badges CASCADE;
DROP INDEX IF EXISTS idx_products_status CASCADE;
DROP INDEX IF EXISTS idx_products_slug CASCADE;
DROP INDEX IF EXISTS idx_products_category_id CASCADE;
DROP INDEX IF EXISTS idx_products_created_at CASCADE;

DROP INDEX IF EXISTS idx_categories_slug CASCADE;
DROP INDEX IF EXISTS idx_categories_parent_id CASCADE;

DROP INDEX IF EXISTS idx_collections_slug CASCADE;
DROP INDEX IF EXISTS idx_collections_is_active CASCADE;

DROP INDEX IF EXISTS idx_product_variants_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_variants_sku CASCADE;
DROP INDEX IF EXISTS idx_product_variants_active CASCADE;

DROP INDEX IF EXISTS idx_product_images_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_images_is_primary CASCADE;

DROP INDEX IF EXISTS idx_product_options_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_option_values_option_id CASCADE;

DROP INDEX IF EXISTS idx_inventory_items_variant_id CASCADE;
DROP INDEX IF EXISTS idx_inventory_logs_variant_id CASCADE;

DROP INDEX IF EXISTS idx_cart_items_user_id CASCADE;
DROP INDEX IF EXISTS idx_cart_items_guest_id CASCADE;
DROP INDEX IF EXISTS idx_cart_items_variant_id CASCADE;

DROP INDEX IF EXISTS idx_wishlist_items_user_id CASCADE;
DROP INDEX IF EXISTS idx_wishlist_items_guest_id CASCADE;
DROP INDEX IF EXISTS idx_wishlist_items_product_id CASCADE;

DROP INDEX IF EXISTS idx_orders_user_id CASCADE;
DROP INDEX IF EXISTS idx_orders_guest_id CASCADE;
DROP INDEX IF EXISTS idx_orders_order_status CASCADE;
DROP INDEX IF EXISTS idx_orders_payment_status CASCADE;
DROP INDEX IF EXISTS idx_orders_created_at CASCADE;

DROP INDEX IF EXISTS idx_order_items_order_id CASCADE;
DROP INDEX IF EXISTS idx_order_items_variant_id CASCADE;

DROP INDEX IF EXISTS idx_payments_order_id CASCADE;
DROP INDEX IF EXISTS idx_payments_status CASCADE;

DROP INDEX IF EXISTS idx_addresses_user_id CASCADE;
DROP INDEX IF EXISTS idx_addresses_guest_id CASCADE;

DROP INDEX IF EXISTS idx_product_categories_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_categories_category_id CASCADE;

DROP INDEX IF EXISTS idx_product_collections_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_collections_collection_id CASCADE;

DROP INDEX IF EXISTS idx_product_tags_slug CASCADE;
DROP INDEX IF EXISTS idx_product_tag_assignments_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_tag_assignments_tag_id CASCADE;

DROP INDEX IF EXISTS idx_banners_is_active CASCADE;
DROP INDEX IF EXISTS idx_banners_placement CASCADE;

DROP INDEX IF EXISTS idx_coupons_code CASCADE;
DROP INDEX IF EXISTS idx_coupons_is_active CASCADE;

DROP INDEX IF EXISTS idx_homepage_sections_position CASCADE;
DROP INDEX IF EXISTS idx_homepage_sections_is_active CASCADE;

DROP INDEX IF EXISTS idx_variant_option_values_variant_id CASCADE;
DROP INDEX IF EXISTS idx_variant_option_values_option_value_id CASCADE;

DROP INDEX IF EXISTS idx_variant_prices_variant_id CASCADE;

DROP INDEX IF EXISTS idx_collection_products_collection_id CASCADE;
DROP INDEX IF EXISTS idx_collection_products_product_id CASCADE;

DROP INDEX IF EXISTS idx_category_tax_rules_category_id CASCADE;
DROP INDEX IF EXISTS idx_product_tax_rules_product_id CASCADE;
DROP INDEX IF EXISTS idx_order_taxes_order_id CASCADE;

-- ================================================
-- DROP ALL FUNCTIONS
-- ================================================

DROP FUNCTION IF EXISTS is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS is_owner_user() CASCADE;

-- ================================================
-- DROP ALL TABLES
-- ================================================
-- Drop tables in reverse dependency order

-- Order-related tables (dependent on orders)
DROP TABLE IF EXISTS order_taxes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;

-- Cart and wishlist
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;

-- Product relationships and metadata
DROP TABLE IF EXISTS product_tag_assignments CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_collections CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS collection_products CASCADE;

-- Tax rules (dependent on products/categories)
DROP TABLE IF EXISTS product_tax_rules CASCADE;
DROP TABLE IF EXISTS category_tax_rules CASCADE;

-- Inventory
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;

-- Variants and options
DROP TABLE IF EXISTS variant_prices CASCADE;
DROP TABLE IF EXISTS variant_option_values CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_option_values CASCADE;
DROP TABLE IF EXISTS product_options CASCADE;

-- Product images
DROP TABLE IF EXISTS product_images CASCADE;

-- Products (depends on categories)
DROP TABLE IF EXISTS products CASCADE;

-- Homepage and collections
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS collections CASCADE;

-- Core tables (no dependencies)
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS tax_settings CASCADE;
DROP TABLE IF EXISTS shipping_rules CASCADE;
DROP TABLE IF EXISTS shipping_settings CASCADE;
DROP TABLE IF EXISTS payment_settings CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS store_locations CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ================================================
-- VERIFICATION
-- ================================================
-- Run this to verify all tables are dropped:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Successfully dropped all existing database objects!';
    RAISE NOTICE 'You can now proceed to execute 02-create-tables.sql';
END $$;
