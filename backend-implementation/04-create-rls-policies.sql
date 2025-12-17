-- ================================================
-- CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================
-- This script sets up RLS policies for e-commerce security
-- Execute this FOURTH after creating indexes
-- ================================================

-- ================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================

-- Store Configuration Tables
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;

-- Tax Tables
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_taxes ENABLE ROW LEVEL SECURITY;

-- Product Catalog
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Inventory
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Collections & Banners
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Shopping
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Orders
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PUBLIC READ POLICIES (Anyone can read)
-- ================================================

-- Store Settings (Public information only)
CREATE POLICY "Public can read store settings"
    ON store_settings FOR SELECT
    USING (true);

-- Store Locations (Active locations are public)
CREATE POLICY "Public can read active store locations"
    ON store_locations FOR SELECT
    USING (is_active = true);

-- Shipping Settings (Public can see shipping info)
CREATE POLICY "Public can read shipping settings"
    ON shipping_settings FOR SELECT
    USING (true);

-- Shipping Rules (Public can see active shipping rules)
CREATE POLICY "Public can read active shipping rules"
    ON shipping_rules FOR SELECT
    USING (is_active = true);

-- Categories (Public read access)
CREATE POLICY "Public can read categories"
    ON categories FOR SELECT
    USING (true);

-- Products (Public can read active products)
CREATE POLICY "Public can read active products"
    ON products FOR SELECT
    USING (status = 'active');

-- Product Images (Public read access)
CREATE POLICY "Public can read product images"
    ON product_images FOR SELECT
    USING (true);

-- Product Options & Values (Public read access)
CREATE POLICY "Public can read product options"
    ON product_options FOR SELECT
    USING (true);

CREATE POLICY "Public can read product option values"
    ON product_option_values FOR SELECT
    USING (true);

-- Product Variants (Public can read active variants)
CREATE POLICY "Public can read active product variants"
    ON product_variants FOR SELECT
    USING (active = true);

-- Variant Option Values (Public read access)
CREATE POLICY "Public can read variant option values"
    ON variant_option_values FOR SELECT
    USING (true);

-- Variant Prices (Public read access)
CREATE POLICY "Public can read variant prices"
    ON variant_prices FOR SELECT
    USING (true);

-- Product Categories (Public read access)
CREATE POLICY "Public can read product categories"
    ON product_categories FOR SELECT
    USING (true);

-- Product Collections (Public read access)
CREATE POLICY "Public can read product collections"
    ON product_collections FOR SELECT
    USING (true);

-- Product Tags (Public read access)
CREATE POLICY "Public can read product tags"
    ON product_tags FOR SELECT
    USING (true);

CREATE POLICY "Public can read product tag assignments"
    ON product_tag_assignments FOR SELECT
    USING (true);

-- Collections (Public can read active collections)
CREATE POLICY "Public can read active collections"
    ON collections FOR SELECT
    USING (is_active = true);

-- Collection Products (Public read access)
CREATE POLICY "Public can read collection products"
    ON collection_products FOR SELECT
    USING (true);

-- Banners (Public can read active banners)
CREATE POLICY "Public can read active banners"
    ON banners FOR SELECT
    USING (is_active = true);

-- Homepage Sections (Public can read active sections)
CREATE POLICY "Public can read active homepage sections"
    ON homepage_sections FOR SELECT
    USING (is_active = true);

-- Inventory Items (Public can check stock availability)
CREATE POLICY "Public can read inventory availability"
    ON inventory_items FOR SELECT
    USING (true);

-- Coupons (Public can validate coupons by code)
CREATE POLICY "Public can read active coupons"
    ON coupons FOR SELECT
    USING (is_active = true);

-- ================================================
-- USER POLICIES (Users access their own data)
-- ================================================

-- Cart Items
CREATE POLICY "Users can read their own cart items"
    ON cart_items FOR SELECT
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can insert their own cart items"
    ON cart_items FOR INSERT
    WITH CHECK (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can update their own cart items"
    ON cart_items FOR UPDATE
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can delete their own cart items"
    ON cart_items FOR DELETE
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

-- Wishlist Items
CREATE POLICY "Users can read their own wishlist items"
    ON wishlist_items FOR SELECT
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can insert their own wishlist items"
    ON wishlist_items FOR INSERT
    WITH CHECK (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can delete their own wishlist items"
    ON wishlist_items FOR DELETE
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

-- Addresses
CREATE POLICY "Users can read their own addresses"
    ON addresses FOR SELECT
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can insert their own addresses"
    ON addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can update their own addresses"
    ON addresses FOR UPDATE
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can delete their own addresses"
    ON addresses FOR DELETE
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

-- Orders
CREATE POLICY "Users can read their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

CREATE POLICY "Users can create their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR guest_id = current_setting('app.guest_id', true));

-- Order Items (read via order ownership)
CREATE POLICY "Users can read their order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.guest_id = current_setting('app.guest_id', true))
        )
    );

-- Order Taxes (read via order ownership)
CREATE POLICY "Users can read their order taxes"
    ON order_taxes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_taxes.order_id 
            AND (orders.user_id = auth.uid() OR orders.guest_id = current_setting('app.guest_id', true))
        )
    );

-- Payments (read via order ownership)
CREATE POLICY "Users can read their payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payments.order_id 
            AND (orders.user_id = auth.uid() OR orders.guest_id = current_setting('app.guest_id', true))
        )
    );

-- ================================================
-- ADMIN POLICIES (Admins have full access)
-- ================================================
-- Note: Requires is_admin_user() function to be created first

-- Store Configuration (Admin full access)
CREATE POLICY "Admins have full access to store settings"
    ON store_settings FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to store locations"
    ON store_locations FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to notification settings"
    ON notification_settings FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to payment settings"
    ON payment_settings FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to shipping settings"
    ON shipping_settings FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to shipping rules"
    ON shipping_rules FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Tax Settings (Admin full access)
CREATE POLICY "Admins have full access to tax settings"
    ON tax_settings FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to category tax rules"
    ON category_tax_rules FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product tax rules"
    ON product_tax_rules FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Categories (Admin full access)
CREATE POLICY "Admins have full access to categories"
    ON categories FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Products (Admin full access)
CREATE POLICY "Admins have full access to products"
    ON products FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product images"
    ON product_images FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product options"
    ON product_options FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product option values"
    ON product_option_values FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product variants"
    ON product_variants FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to variant option values"
    ON variant_option_values FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to variant prices"
    ON variant_prices FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product categories"
    ON product_categories FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product collections"
    ON product_collections FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product tags"
    ON product_tags FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to product tag assignments"
    ON product_tag_assignments FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Inventory (Admin full access)
CREATE POLICY "Admins have full access to inventory items"
    ON inventory_items FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to inventory logs"
    ON inventory_logs FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Collections & Banners (Admin full access)
CREATE POLICY "Admins have full access to collections"
    ON collections FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to collection products"
    ON collection_products FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to banners"
    ON banners FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to homepage sections"
    ON homepage_sections FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Coupons (Admin full access)
CREATE POLICY "Admins have full access to coupons"
    ON coupons FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Orders (Admin full access)
CREATE POLICY "Admins have full access to orders"
    ON orders FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to order items"
    ON order_items FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to order taxes"
    ON order_taxes FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to payments"
    ON payments FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to addresses"
    ON addresses FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to cart items"
    ON cart_items FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admins have full access to wishlist items"
    ON wishlist_items FOR ALL
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- ================================================
-- SERVICE ROLE BYPASS (For server-side operations)
-- ================================================
-- Service role bypasses RLS, so no explicit policies needed
-- Use service_role key for admin operations in your backend

-- ================================================
-- VERIFICATION & SUCCESS MESSAGE
-- ================================================

DO $$ 
DECLARE
    policy_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Successfully created RLS policies!';
    RAISE NOTICE 'Total policies created: %', policy_count;
    RAISE NOTICE 'RLS enabled on % tables', table_count;
    RAISE NOTICE 'Next step: Execute 05-create-functions.sql';
END $$;
