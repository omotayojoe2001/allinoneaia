-- Create table for storing KClaut services
CREATE TABLE IF NOT EXISTS kclaut_services (
  id BIGSERIAL PRIMARY KEY,
  service_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  rate DECIMAL(10, 2) NOT NULL,
  min_order INTEGER NOT NULL,
  max_order INTEGER NOT NULL,
  category TEXT NOT NULL,
  refill BOOLEAN DEFAULT false,
  cancel BOOLEAN DEFAULT false,
  average_time TEXT,
  description TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kclaut_services_category ON kclaut_services(category);
CREATE INDEX IF NOT EXISTS idx_kclaut_services_service_id ON kclaut_services(service_id);

ALTER TABLE kclaut_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services" ON kclaut_services
  FOR SELECT USING (true);
