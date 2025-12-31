-- Enable pg_trgm extension for fast partial string matching (ILIKE '%term%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;

--------------------------------------------------------------------------------
-- 1. INDEXES (Performance)
--------------------------------------------------------------------------------

-- Products: Title and Slug (Description is usually too long for simple indexes, better for Full Text Search later)
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_handle_trgm ON products USING gin (url_handle gin_trgm_ops);

-- Product Variants: SKU (Crucial for admin search)
CREATE INDEX IF NOT EXISTS idx_variants_sku_trgm ON product_variants USING gin (sku gin_trgm_ops);

-- Orders: ID, Razorpay Order ID, Customer Details
-- Note: 'order_number' does not exist in schema, so we index razorpay_order_id and id (cast to text)
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_id_trgm ON orders USING gin (razorpay_order_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_email_trgm ON orders USING gin (customer_email_snapshot gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email_trgm ON orders USING gin (guest_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm ON orders USING gin (customer_phone_snapshot gin_trgm_ops);


--------------------------------------------------------------------------------
-- 2. RPC FUNCTIONS (Search Logic)
--------------------------------------------------------------------------------

-- SEARCH PRODUCTS
-- Returns a set of unique products matching title, handle, OR variant SKU
CREATE OR REPLACE FUNCTION admin_search_products(search_term text)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM products p
  LEFT JOIN product_variants pv ON p.id = pv.product_id
  WHERE
    search_term IS NULL OR search_term = ''
    OR p.title ILIKE '%' || search_term || '%'
    OR p.url_handle ILIKE '%' || search_term || '%'
    OR pv.sku ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql STABLE;


-- SEARCH ORDERS
-- Returns a set of orders matching ID, razorpay ID, email, phone, or name
CREATE OR REPLACE FUNCTION admin_search_orders(search_term text)
RETURNS SETOF orders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM orders
  WHERE
    search_term IS NULL OR search_term = ''
    OR razorpay_order_id ILIKE '%' || search_term || '%'
    OR customer_email_snapshot ILIKE '%' || search_term || '%'
    OR guest_email ILIKE '%' || search_term || '%'
    OR customer_phone_snapshot ILIKE '%' || search_term || '%'
    OR customer_name_snapshot ILIKE '%' || search_term || '%'
    OR id::text ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql STABLE;
