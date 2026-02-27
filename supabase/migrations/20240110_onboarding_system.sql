-- User Onboarding Progress
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  business_type TEXT, -- retail, service, manufacturing, etc.
  business_size TEXT, -- solo, small, medium
  primary_goals JSONB, -- ['track_expenses', 'manage_inventory', 'payroll']
  skipped BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_onboarding_user ON user_onboarding(user_id);
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON user_onboarding FOR ALL USING (auth.uid() = user_id);

-- Feature Usage Tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1
);

CREATE INDEX idx_feature_usage_user ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature ON feature_usage(feature_name);
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own feature usage" ON feature_usage FOR ALL USING (auth.uid() = user_id);
