-- Low Stock Notifications Tracking Table
-- This table tracks which products have been flagged as low stock
-- to prevent duplicate notifications and enable daily digest emails

CREATE TABLE IF NOT EXISTS low_stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't have duplicate active notifications for same product/variant
  UNIQUE(product_id, variant_id) WHERE resolved_at IS NULL
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_low_stock_notifications_unresolved 
  ON low_stock_notifications(product_id, variant_id) 
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_low_stock_notifications_pending 
  ON low_stock_notifications(notified_at) 
  WHERE notified_at IS NULL;

-- Enable RLS
ALTER TABLE low_stock_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can manage all notifications
CREATE POLICY "Admin users can manage low stock notifications"
  ON low_stock_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_low_stock_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_low_stock_notifications_updated_at
  BEFORE UPDATE ON low_stock_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_low_stock_notifications_updated_at();

COMMENT ON TABLE low_stock_notifications IS 'Tracks products with low stock for email notification management';
COMMENT ON COLUMN low_stock_notifications.notified_at IS 'When the admin was notified about this low stock';
COMMENT ON COLUMN low_stock_notifications.resolved_at IS 'When the stock was replenished above threshold';
