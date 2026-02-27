-- Tax Calculations Table
CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_type TEXT NOT NULL, -- 'vat', 'wht', 'paye', 'pension'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  due_date DATE,
  payment_date DATE,
  notes TEXT,
  metadata JSONB, -- Store additional details like PAYE breakdown, WHT category, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_tax_calculations_user_id ON tax_calculations(user_id);
CREATE INDEX idx_tax_calculations_type ON tax_calculations(calculation_type);
CREATE INDEX idx_tax_calculations_period ON tax_calculations(period_start, period_end);
CREATE INDEX idx_tax_calculations_status ON tax_calculations(status);

-- RLS Policies
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax calculations"
  ON tax_calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax calculations"
  ON tax_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax calculations"
  ON tax_calculations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax calculations"
  ON tax_calculations FOR DELETE
  USING (auth.uid() = user_id);

-- Tax Settings Table (for user-specific tax configurations)
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vat_rate DECIMAL(5,2) DEFAULT 7.5,
  wht_rates JSONB DEFAULT '{"services": 5, "rent": 10, "dividends": 10, "interest": 10, "royalties": 10, "consultancy": 5}',
  paye_enabled BOOLEAN DEFAULT true,
  pension_enabled BOOLEAN DEFAULT true,
  pension_rate_employee DECIMAL(5,2) DEFAULT 8.0,
  pension_rate_employer DECIMAL(5,2) DEFAULT 10.0,
  tax_id_number TEXT,
  pension_pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index and RLS for tax_settings
CREATE INDEX idx_tax_settings_user_id ON tax_settings(user_id);

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax settings"
  ON tax_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax settings"
  ON tax_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax settings"
  ON tax_settings FOR UPDATE
  USING (auth.uid() = user_id);
