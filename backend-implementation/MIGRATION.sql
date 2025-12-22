-- ================================================
-- MIGRATION: Fix Categories Table Schema
-- ================================================
-- This migration adds missing columns to the categories table
-- Run this in Supabase SQL Editor
-- ================================================

-- Add new columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS homepage_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS homepage_video_url TEXT,
ADD COLUMN IF NOT EXISTS plp_square_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS selected_banner_id UUID REFERENCES banners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Migrate data from old 'image' column to 'image_url' if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'image'
    ) THEN
        UPDATE categories SET image_url = image WHERE image IS NOT NULL AND image_url IS NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Update existing categories to have default status
UPDATE categories SET status = 'active' WHERE status IS NULL;

-- Add helpful comments
COMMENT ON TABLE categories IS 'Product categories with enhanced media support for homepage and PLP display';
COMMENT ON COLUMN categories.homepage_thumbnail_url IS 'Thumbnail image URL for homepage category display';
COMMENT ON COLUMN categories.homepage_video_url IS 'Optional video URL for homepage category display';
COMMENT ON COLUMN categories.plp_square_thumbnail_url IS 'Square thumbnail URL for product listing page display';
COMMENT ON COLUMN categories.selected_banner_id IS 'Reference to banner used for this category';
COMMENT ON COLUMN categories.meta_title IS 'SEO meta title for category page';
COMMENT ON COLUMN categories.meta_description IS 'SEO meta description for category page';
COMMENT ON COLUMN categories.status IS 'Category status: active or inactive';
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories (lower numbers first)';

-- Verify migration
DO $$ 
BEGIN
    RAISE NOTICE '✅ Categories table migration completed successfully!';
    RAISE NOTICE 'New columns added: homepage_thumbnail_url, homepage_video_url, plp_square_thumbnail_url, selected_banner_id, image_url, icon_url, meta_title, meta_description, status, display_order';
END $$;
