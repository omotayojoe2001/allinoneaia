-- AI Query History
CREATE TABLE IF NOT EXISTS ai_analytics_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_type TEXT, -- 'revenue', 'expenses', 'customers', 'inventory', 'staff', 'general'
  response_data JSONB,
  response_summary TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_queries_user_id ON ai_analytics_queries(user_id);
CREATE INDEX idx_ai_queries_type ON ai_analytics_queries(query_type);
CREATE INDEX idx_ai_queries_date ON ai_analytics_queries(created_at);

ALTER TABLE ai_analytics_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI queries"
  ON ai_analytics_queries FOR ALL
  USING (auth.uid() = user_id);

-- Business Health Scores
CREATE TABLE IF NOT EXISTS business_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  overall_score INTEGER NOT NULL, -- 0-100
  cash_flow_score INTEGER, -- 0-100
  revenue_growth_score INTEGER,
  customer_retention_score INTEGER,
  inventory_health_score INTEGER,
  financial_stability_score INTEGER,
  factors JSONB, -- Detailed breakdown of what affected the score
  recommendations JSONB, -- AI-generated recommendations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_scores_user_id ON business_health_scores(user_id);
CREATE INDEX idx_health_scores_date ON business_health_scores(score_date);

ALTER TABLE business_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own health scores"
  ON business_health_scores FOR ALL
  USING (auth.uid() = user_id);

-- Predictive Forecasts
CREATE TABLE IF NOT EXISTS ai_predictive_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL, -- 'revenue', 'expenses', 'cash_flow', 'customer_churn'
  forecast_period TEXT NOT NULL, -- '30_days', '60_days', '90_days', '6_months', '1_year'
  current_value DECIMAL(15,2),
  predicted_value DECIMAL(15,2),
  confidence_level DECIMAL(5,2), -- 0-100
  factors JSONB, -- What influenced the prediction
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forecasts_user_id ON ai_predictive_forecasts(user_id);
CREATE INDEX idx_forecasts_type ON ai_predictive_forecasts(forecast_type);

ALTER TABLE ai_predictive_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own forecasts"
  ON ai_predictive_forecasts FOR ALL
  USING (auth.uid() = user_id);

-- Risk Alerts
CREATE TABLE IF NOT EXISTS ai_risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'cash_flow', 'customer_churn', 'inventory', 'expense_spike', 'revenue_drop'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_actions JSONB,
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_risk_alerts_user_id ON ai_risk_alerts(user_id);
CREATE INDEX idx_risk_alerts_severity ON ai_risk_alerts(severity);
CREATE INDEX idx_risk_alerts_status ON ai_risk_alerts(status);

ALTER TABLE ai_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own risk alerts"
  ON ai_risk_alerts FOR ALL
  USING (auth.uid() = user_id);
