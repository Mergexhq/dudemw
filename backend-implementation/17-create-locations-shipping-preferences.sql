-- ================================================
-- Additional Settings Tables
-- Store Locations, Shipping Rules, System Preferences
-- ================================================

-- ================================================
-- 1. STORE LOCATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS store_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('warehouse', 'store', 'distribution')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one primary location exists
CREATE OR REPLACE FUNCTION enforce_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE store_locations 
    SET is_primary = FALSE 
    WHERE id != NEW.id AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_location
BEFORE INSERT OR UPDATE ON store_locations
FOR EACH ROW
EXECUTE FUNCTION enforce_single_primary_location();

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_store_locations_is_primary ON store_locations(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_store_locations_is_active ON store_locations(is_active);

COMMENT ON TABLE store_locations IS 'Physical store and warehouse locations';

-- ================================================
-- 2. SHIPPING RULES TABLE (Simplified)
-- ================================================
CREATE TABLE IF NOT EXISTS shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL CHECK (zone IN (
    'tamil_nadu', 
    'south_india', 
    'north_india', 
    'east_india', 
    'west_india', 
    'all_india'
  )),
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER, -- NULL means unlimited
  rate NUMERIC(10,2) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure quantity ranges make sense
  CONSTRAINT valid_quantity_range CHECK (max_quantity IS NULL OR max_quantity >= min_quantity)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_shipping_rules_zone ON shipping_rules(zone);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_enabled ON shipping_rules(is_enabled);

COMMENT ON TABLE shipping_rules IS 'Quantity-based shipping rules per zone';

-- ================================================
-- 3. SYSTEM PREFERENCES TABLE (Enhanced)
-- ================================================
CREATE TABLE IF NOT EXISTS system_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Behavior
  auto_cancel_enabled BOOLEAN DEFAULT TRUE,
  auto_cancel_minutes INTEGER DEFAULT 30,
  guest_checkout_enabled BOOLEAN DEFAULT TRUE,
  
  -- Inventory Rules
  low_stock_threshold INTEGER DEFAULT 10,
  allow_backorders BOOLEAN DEFAULT FALSE,
  
  -- Email Notifications
  order_placed_email BOOLEAN DEFAULT TRUE,
  order_shipped_email BOOLEAN DEFAULT TRUE,
  low_stock_alert BOOLEAN DEFAULT TRUE,
  
  -- Free Shipping Settings
  free_shipping_enabled BOOLEAN DEFAULT FALSE,
  free_shipping_threshold NUMERIC(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_preferences IS 'System-wide operational preferences';

-- ================================================
-- RLS POLICIES (Row Level Security)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_preferences ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin full access to store_locations" ON store_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to shipping_rules" ON shipping_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to system_preferences" ON system_preferences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'owner', 'super_admin')
    )
  );

-- Public can read active locations (for store locator)
CREATE POLICY "Public can view active store_locations" ON store_locations
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Public can read enabled shipping rules (for checkout)
CREATE POLICY "Public can view enabled shipping_rules" ON shipping_rules
  FOR SELECT
  TO public
  USING (is_enabled = TRUE);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Verify tables exist
SELECT 
  table_name,
  EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t.table_name
  ) as table_exists
FROM (
  VALUES 
    ('store_locations'),
    ('shipping_rules'),
    ('system_preferences')
) AS t(table_name);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   ✅ TABLES CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  ✅ store_locations (with primary constraint)';
    RAISE NOTICE '  ✅ shipping_rules (zone-based, quantity tiers)';
    RAISE NOTICE '  ✅ system_preferences (order, inventory, email)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies:';
    RAISE NOTICE '  ✅ Admin full access on all tables';
    RAISE NOTICE '  ✅ Public read access for active/enabled records';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Insert default system preferences';
    RAISE NOTICE '  2. Update frontend components';
    RAISE NOTICE '  3. Test CRUD operations';
    RAISE NOTICE '';
END $$;