-- Customer Analytics & Intelligence
CREATE TABLE IF NOT EXISTS customer_analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(15,2) DEFAULT 0,
  first_purchase_date DATE,
  last_purchase_date DATE,
  days_since_last_purchase INTEGER,
  purchase_frequency DECIMAL(10,2), -- average days between purchases
  lifetime_value DECIMAL(15,2) DEFAULT 0,
  customer_grade TEXT, -- 'A', 'B', 'C', 'D'
  lead_score INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'active', -- 'active', 'dormant', 'at_risk', 'lost'
  risk_level TEXT, -- 'low', 'medium', 'high'
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customer_analytics_user_id ON customer_analytics_cache(user_id);
CREATE INDEX idx_customer_analytics_customer_id ON customer_analytics_cache(customer_id);
CREATE INDEX idx_customer_analytics_grade ON customer_analytics_cache(customer_grade);
CREATE INDEX idx_customer_analytics_status ON customer_analytics_cache(status);
CREATE INDEX idx_customer_analytics_lead_score ON customer_analytics_cache(lead_score);

ALTER TABLE customer_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own customer analytics"
  ON customer_analytics_cache FOR ALL
  USING (auth.uid() = user_id);

-- Customer Engagement Campaigns
CREATE TABLE IF NOT EXISTS customer_engagement_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'reengagement', 'loyalty', 'winback', 'upsell'
  target_segment TEXT, -- 'dormant', 'high_value', 'at_risk', 'all'
  message_template TEXT,
  discount_code TEXT,
  discount_percentage DECIMAL(5,2),
  channel TEXT DEFAULT 'email', -- 'email', 'whatsapp', 'both'
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_engagement_campaigns_user_id ON customer_engagement_campaigns(user_id);
CREATE INDEX idx_engagement_campaigns_status ON customer_engagement_campaigns(status);
CREATE INDEX idx_engagement_campaigns_type ON customer_engagement_campaigns(campaign_type);

ALTER TABLE customer_engagement_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns"
  ON customer_engagement_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Customer Interaction History
CREATE TABLE IF NOT EXISTS customer_interaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'purchase', 'email_sent', 'email_opened', 'whatsapp_sent', 'call', 'meeting'
  interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(15,2),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interaction_history_user_id ON customer_interaction_history(user_id);
CREATE INDEX idx_interaction_history_customer_id ON customer_interaction_history(customer_id);
CREATE INDEX idx_interaction_history_type ON customer_interaction_history(interaction_type);
CREATE INDEX idx_interaction_history_date ON customer_interaction_history(interaction_date);

ALTER TABLE customer_interaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interaction history"
  ON customer_interaction_history FOR ALL
  USING (auth.uid() = user_id);
