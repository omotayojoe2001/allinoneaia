-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT,
  service_type TEXT,
  markup_percentage DECIMAL(5,2) DEFAULT 60.00,
  min_markup DECIMAL(10,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing rules
INSERT INTO pricing_rules (platform, service_type, markup_percentage, min_markup) VALUES
('Instagram', 'Followers', 60.00, 1.00),
('Instagram', 'Likes', 55.00, 1.00),
('Facebook', 'Followers', 60.00, 1.00),
('Facebook', 'Likes', 55.00, 1.00),
('TikTok', 'Followers', 60.00, 1.00),
('TikTok', 'Likes', 55.00, 1.00),
('YouTube', 'Subscribers', 65.00, 1.00),
('YouTube', 'Views', 55.00, 1.00),
(NULL, NULL, 60.00, 1.00) -- Default for all others
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Allow public read
DROP POLICY IF EXISTS "Allow public read pricing rules" ON pricing_rules;
CREATE POLICY "Allow public read pricing rules" ON pricing_rules
  FOR SELECT USING (true);
