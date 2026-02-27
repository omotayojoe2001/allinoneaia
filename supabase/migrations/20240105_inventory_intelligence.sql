-- Inventory Analytics Cache
CREATE TABLE IF NOT EXISTS inventory_analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  current_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  sales_velocity DECIMAL(10,2), -- units per day
  days_until_stockout INTEGER,
  last_30_days_sold INTEGER DEFAULT 0,
  last_60_days_sold INTEGER DEFAULT 0,
  last_90_days_sold INTEGER DEFAULT 0,
  revenue_last_30_days DECIMAL(15,2) DEFAULT 0,
  best_seller_rank INTEGER,
  stock_status TEXT, -- 'healthy', 'low', 'critical', 'out_of_stock'
  seasonal_pattern JSONB, -- Store monthly sales patterns
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_analytics_user_id ON inventory_analytics_cache(user_id);
CREATE INDEX idx_inventory_analytics_product_id ON inventory_analytics_cache(product_id);
CREATE INDEX idx_inventory_analytics_status ON inventory_analytics_cache(stock_status);
CREATE INDEX idx_inventory_analytics_rank ON inventory_analytics_cache(best_seller_rank);

ALTER TABLE inventory_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inventory analytics"
  ON inventory_analytics_cache FOR ALL
  USING (auth.uid() = user_id);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders_auto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  po_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT,
  supplier_email TEXT,
  supplier_phone TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'ordered', 'received', 'cancelled'
  total_amount DECIMAL(15,2) DEFAULT 0,
  items JSONB NOT NULL, -- Array of {product_id, product_name, quantity, unit_cost, total}
  notes TEXT,
  order_date DATE,
  expected_delivery_date DATE,
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_user_id ON purchase_orders_auto(user_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders_auto(status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders_auto(po_number);

ALTER TABLE purchase_orders_auto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own purchase orders"
  ON purchase_orders_auto FOR ALL
  USING (auth.uid() = user_id);

-- Stock Valuation History
CREATE TABLE IF NOT EXISTS stock_valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_stock_value DECIMAL(15,2) DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  low_stock_items INTEGER DEFAULT 0,
  out_of_stock_items INTEGER DEFAULT 0,
  stock_turnover_ratio DECIMAL(10,2),
  details JSONB, -- Store per-product breakdown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_valuation_user_id ON stock_valuation_snapshots(user_id);
CREATE INDEX idx_stock_valuation_date ON stock_valuation_snapshots(snapshot_date);

ALTER TABLE stock_valuation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stock valuations"
  ON stock_valuation_snapshots FOR ALL
  USING (auth.uid() = user_id);
