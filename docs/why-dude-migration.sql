-- Create the why_dude_sections table
CREATE TABLE IF NOT EXISTS why_dude_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'badge-check',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on sort_order for better performance
CREATE INDEX IF NOT EXISTS idx_why_dude_sections_sort_order ON why_dude_sections(sort_order);

-- Create an index on is_active for better performance
CREATE INDEX IF NOT EXISTS idx_why_dude_sections_is_active ON why_dude_sections(is_active);

-- Insert default data (the current hardcoded features)
INSERT INTO why_dude_sections (title, description, icon_name, sort_order, is_active) VALUES
('PREMIUM COTTON', '100% breathable fabric', 'shirt', 0, true),
('FAST SHIPPING', '2-4 days delivery', 'truck', 1, true),
('EASY RETURNS', '7-day hassle-free', 'rotate-ccw', 2, true),
('10K+ HAPPY DUDES', 'Trusted by thousands', 'badge-check', 3, true);

-- Enable Row Level Security (RLS)
ALTER TABLE why_dude_sections ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for the frontend)
CREATE POLICY "Allow public read access" ON why_dude_sections
    FOR SELECT USING (true);

-- Create policy for authenticated admin users to manage features
CREATE POLICY "Allow admin users full access" ON why_dude_sections
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_why_dude_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_why_dude_sections_updated_at
    BEFORE UPDATE ON why_dude_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_why_dude_sections_updated_at();