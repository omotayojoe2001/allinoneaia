-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- executive, sales, expense, customer, inventory, staff, financial
  data_sources JSONB, -- {tables: ['cashbook', 'invoices'], fields: ['amount', 'date']}
  filters JSONB, -- {date_range: '30_days', category: 'sales'}
  grouping JSONB, -- {group_by: 'category', aggregate: 'sum'}
  visualization TEXT DEFAULT 'table', -- table, bar, line, pie, heatmap
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_reports_user ON custom_reports(user_id);
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage custom reports" ON custom_reports FOR ALL USING (auth.uid() = user_id);

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL, -- daily, weekly, monthly
  schedule_time TIME,
  schedule_day INTEGER, -- 1-31 for monthly, 0-6 for weekly
  recipients JSONB, -- ['email1@example.com', 'email2@example.com']
  format TEXT DEFAULT 'pdf', -- pdf, excel, csv
  status TEXT DEFAULT 'active',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next_send ON scheduled_reports(next_send_at);
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage scheduled reports" ON scheduled_reports FOR ALL USING (auth.uid() = user_id);

-- Report Snapshots
CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_snapshots_user ON report_snapshots(user_id);
CREATE INDEX idx_report_snapshots_report ON report_snapshots(report_id);
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view report snapshots" ON report_snapshots FOR ALL USING (auth.uid() = user_id);

-- Financial Health Metrics
CREATE TABLE IF NOT EXISTS financial_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  current_ratio DECIMAL(10,2),
  quick_ratio DECIMAL(10,2),
  debt_to_equity DECIMAL(10,2),
  working_capital DECIMAL(15,2),
  gross_profit_margin DECIMAL(5,2),
  net_profit_margin DECIMAL(5,2),
  return_on_assets DECIMAL(5,2),
  cash_flow_ratio DECIMAL(10,2),
  health_score INTEGER, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_financial_health_user ON financial_health_metrics(user_id);
CREATE INDEX idx_financial_health_date ON financial_health_metrics(metric_date);
ALTER TABLE financial_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view financial health" ON financial_health_metrics FOR ALL USING (auth.uid() = user_id);

-- Budget Tracking
CREATE TABLE IF NOT EXISTS budget_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  budgeted_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  variance DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  status TEXT, -- under_budget, on_budget, over_budget
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budget_tracking_user ON budget_tracking(user_id);
CREATE INDEX idx_budget_tracking_period ON budget_tracking(period_start, period_end);
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage budget tracking" ON budget_tracking FOR ALL USING (auth.uid() = user_id);
