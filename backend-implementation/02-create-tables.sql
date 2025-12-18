-- ================================================
-- CREATE ALL DATABASE TABLES
-- ================================================
-- This script creates all tables with proper constraints
-- Execute this SECOND after dropping existing objects
-- ================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- STORE CONFIGURATION TABLES
-- ================================================

-- Store Settings
CREATE TABLE store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'Dude Men''s Wears',
    legal_name TEXT,
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    gst_number TEXT,
    invoice_prefix TEXT,
    support_email TEXT,
    support_phone TEXT,
    terms_url TEXT,
    privacy_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Locations
CREATE TABLE store_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Settings
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_confirmation_enabled BOOLEAN DEFAULT TRUE,
    shipment_update_enabled BOOLEAN DEFAULT TRUE,
    low_stock_alert_enabled BOOLEAN DEFAULT TRUE,
    low_stock_threshold INTEGER DEFAULT 10,
    refund_notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Settings
CREATE TABLE payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Settings
CREATE TABLE shipping_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_rate NUMERIC(10, 2),
    free_shipping_min NUMERIC(10, 2),
    cod_enabled BOOLEAN DEFAULT FALSE,
    delivery_estimate_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Rules
CREATE TABLE shipping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone TEXT NOT NULL,
    provider TEXT DEFAULT 'Standard',
    max_quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TAX CONFIGURATION TABLES (NEW)
-- ================================================

-- Tax Settings
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_enabled BOOLEAN DEFAULT TRUE,
    price_includes_tax BOOLEAN DEFAULT TRUE,
    default_gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    store_state TEXT NOT NULL DEFAULT 'Maharashtra',
    gstin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CATEGORIES
-- ================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category Tax Rules (NEW)
CREATE TABLE category_tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    gst_rate NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id)
);

-- ================================================
-- COLLECTIONS
-- ================================================

CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rule_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PRODUCTS
-- ================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    url_handle TEXT,
    
    -- Pricing
    price NUMERIC(10, 2) DEFAULT 0,
    compare_price NUMERIC(10, 2),
    cost NUMERIC(10, 2),
    
    -- Inventory
    in_stock BOOLEAN DEFAULT TRUE,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorders BOOLEAN DEFAULT FALSE,
    low_stock_threshold INTEGER,
    
    -- Organization
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    
    -- Arrays for legacy support
    images TEXT[],
    sizes TEXT[],
    colors TEXT[],
    highlights TEXT[],
    
    -- Badge flags
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_new_drop BOOLEAN DEFAULT FALSE,
    
    -- Status
    status TEXT DEFAULT 'draft',
    taxable BOOLEAN DEFAULT TRUE,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tax Rules (NEW)
CREATE TABLE product_tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    gst_rate NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)
);

-- Product Images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Options (Size, Color, etc.)
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Option Values (M, L, XL, Red, Blue, etc.)
CREATE TABLE product_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex_color TEXT,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT,
    sku TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sku)
);

-- Variant Option Values (junction table)
CREATE TABLE variant_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, option_value_id)
);

-- Variant Prices
CREATE TABLE variant_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    price_type TEXT DEFAULT 'default',
    amount NUMERIC(10, 2) NOT NULL,
    compare_at_amount NUMERIC(10, 2),
    cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INVENTORY
-- ================================================

-- Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    sku TEXT,
    barcode TEXT,
    quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    cost NUMERIC(10, 2),
    track_quantity BOOLEAN DEFAULT TRUE,
    allow_backorders BOOLEAN DEFAULT FALSE,
    low_stock_threshold INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id)
);

-- Inventory Logs
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PRODUCT RELATIONSHIPS
-- ================================================

-- Product-Category Junction
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, category_id)
);

-- Product-Collection Junction
CREATE TABLE product_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, collection_id)
);

-- Collection-Product Junction (alternate structure)
CREATE TABLE collection_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tags
CREATE TABLE product_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product-Tag Junction
CREATE TABLE product_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, tag_id)
);

-- ================================================
-- BANNERS & HOMEPAGE
-- ================================================

-- Banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    placement TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homepage Sections
CREATE TABLE homepage_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    layout TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SHOPPING CART & WISHLIST
-- ================================================

-- Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    guest_id TEXT,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Wishlist Items
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    guest_id TEXT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- ================================================
-- COUPONS
-- ================================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ADDRESSES
-- ================================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    guest_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- ================================================
-- ORDERS
-- ================================================

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    guest_id TEXT,
    guest_email TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_amount NUMERIC(10, 2),
    shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    shipping_zone TEXT,
    shipping_provider TEXT,
    shipping_tracking_number TEXT,
    order_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    razorpay_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Taxes (NEW)
CREATE TABLE order_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    taxable_amount NUMERIC(10, 2) NOT NULL,
    cgst NUMERIC(10, 2) DEFAULT 0,
    sgst NUMERIC(10, 2) DEFAULT 0,
    igst NUMERIC(10, 2) DEFAULT 0,
    total_tax NUMERIC(10, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('intra-state', 'inter-state')),
    store_state TEXT NOT NULL,
    customer_state TEXT NOT NULL,
    price_includes_tax BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

-- ================================================
-- PAYMENTS
-- ================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'razorpay',
    payment_id TEXT,
    status TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Successfully created all 36 database tables!';
    RAISE NOTICE 'Next step: Execute 03-create-indexes.sql';
END $$;
