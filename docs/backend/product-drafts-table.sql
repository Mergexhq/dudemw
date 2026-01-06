-- Create product_drafts table for auto-save functionality
-- Prevents data loss in product creation form

CREATE TABLE IF NOT EXISTS product_drafts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_product_drafts_user_id
ON product_drafts(user_id, updated_at DESC);

-- Index for cleanup of old drafts
CREATE INDEX IF NOT EXISTS idx_product_drafts_updated_at
ON product_drafts(updated_at);

-- RLS Policies
ALTER TABLE product_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own drafts
CREATE POLICY "Users can view own drafts"
ON product_drafts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own drafts
CREATE POLICY "Users can create own drafts"
ON product_drafts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
ON product_drafts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
ON product_drafts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to auto-delete drafts older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM product_drafts
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-drafts', '0 2 * * *', 'SELECT cleanup_old_drafts()');
