-- Template Categories
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates (Original, immutable)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES template_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  preview_url VARCHAR(500),
  html_content TEXT NOT NULL,
  css_content TEXT,
  js_content TEXT,
  form_fields JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- User Websites (Instance of template)
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  subdomain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Website Customizations (AI modifications stored as diffs)
CREATE TABLE IF NOT EXISTS website_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  html_modifications JSONB DEFAULT '{}'::jsonb,
  css_modifications JSONB DEFAULT '{}'::jsonb,
  js_modifications JSONB DEFAULT '{}'::jsonb,
  text_replacements JSONB DEFAULT '{}'::jsonb,
  section_order JSONB DEFAULT '[]'::jsonb,
  customization_history JSONB DEFAULT '[]'::jsonb,
  last_customized_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id)
);

-- Website Forms (Form configuration)
CREATE TABLE IF NOT EXISTS website_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  form_name VARCHAR(255) NOT NULL,
  form_type VARCHAR(50) DEFAULT 'contact', -- contact, newsletter, event, waitlist, etc
  list_id UUID NOT NULL,
  automation_type VARCHAR(50) NOT NULL, -- email, whatsapp, sms, multi
  email_sequence_id UUID,
  whatsapp_sequence_id UUID,
  sms_sequence_id UUID,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  field_mapping JSONB DEFAULT '{}'::jsonb,
  success_message VARCHAR(500),
  redirect_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES website_forms(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID,
  submission_data JSONB NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  automation_triggered BOOLEAN DEFAULT FALSE,
  email_sequence_triggered BOOLEAN DEFAULT FALSE,
  whatsapp_sequence_triggered BOOLEAN DEFAULT FALSE,
  sms_sequence_triggered BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Website Analytics (Track visits and conversions)
CREATE TABLE IF NOT EXISTS website_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  form_submissions INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id)
);

-- Create indexes for performance
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_active ON templates(is_active);
CREATE INDEX idx_user_websites_user ON user_websites(user_id);
CREATE INDEX idx_user_websites_template ON user_websites(template_id);
CREATE INDEX idx_user_websites_status ON user_websites(status);
CREATE INDEX idx_user_websites_subdomain ON user_websites(subdomain);
CREATE INDEX idx_website_customizations_website ON website_customizations(website_id);
CREATE INDEX idx_website_forms_website ON website_forms(website_id);
CREATE INDEX idx_website_forms_list ON website_forms(list_id);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_website ON form_submissions(website_id);
CREATE INDEX idx_form_submissions_user ON form_submissions(user_id);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at);
CREATE INDEX idx_website_analytics_website ON website_analytics(website_id);
CREATE INDEX idx_website_analytics_user ON website_analytics(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
-- template_categories doesn't need RLS since it's public data
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Templates: Public read, admin write
CREATE POLICY "Templates are viewable by everyone" ON templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Only admins can insert templates" ON templates FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can update templates" ON templates FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Template Categories: Public read, admin write (no RLS needed - public data)

-- User Websites: Users can only see their own
CREATE POLICY "Users can view their own websites" ON user_websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own websites" ON user_websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own websites" ON user_websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own websites" ON user_websites FOR DELETE USING (auth.uid() = user_id);

-- Website Customizations: Users can only see their own
CREATE POLICY "Users can view their own customizations" ON website_customizations FOR SELECT USING (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own customizations" ON website_customizations FOR INSERT WITH CHECK (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own customizations" ON website_customizations FOR UPDATE USING (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);

-- Website Forms: Users can only see their own
CREATE POLICY "Users can view their own forms" ON website_forms FOR SELECT USING (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own forms" ON website_forms FOR INSERT WITH CHECK (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own forms" ON website_forms FOR UPDATE USING (
  website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid())
);

-- Form Submissions: Users can only see their own
CREATE POLICY "Users can view their own submissions" ON form_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert submissions" ON form_submissions FOR INSERT WITH CHECK (TRUE);

-- Website Analytics: Users can only see their own
CREATE POLICY "Users can view their own analytics" ON website_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON website_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics" ON website_analytics FOR UPDATE USING (auth.uid() = user_id);
