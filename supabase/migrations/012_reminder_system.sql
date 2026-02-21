-- Reminder System Database Schema

-- Reminder types and categories
CREATE TABLE IF NOT EXISTS reminder_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO reminder_categories (name, description, icon) VALUES
  ('invoice', 'Invoice payment reminders', 'receipt'),
  ('appointment', 'Appointment reminders', 'calendar'),
  ('stock', 'Stock level alerts', 'package'),
  ('task', 'Task and deadline reminders', 'check-square'),
  ('automation', 'Automation workflow reminders', 'zap'),
  ('content', 'Content publishing reminders', 'file-text'),
  ('social', 'Social media post reminders', 'share-2'),
  ('custom', 'Custom user reminders', 'bell')
ON CONFLICT (name) DO NOTHING;

-- Reminder settings per category
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT REFERENCES reminder_categories(name),
  enabled BOOLEAN DEFAULT true,
  advance_minutes INTEGER DEFAULT 60,
  repeat_count INTEGER DEFAULT 1,
  repeat_interval_minutes INTEGER DEFAULT 1440,
  send_email BOOLEAN DEFAULT true,
  send_whatsapp BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Main reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT REFERENCES reminder_categories(name),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'cancelled')),
  related_id UUID,
  related_type TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder notifications log
CREATE TABLE IF NOT EXISTS reminder_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'whatsapp', 'push', 'in_app')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE reminder_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can read categories" ON reminder_categories;
CREATE POLICY "Public can read categories" ON reminder_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage their settings" ON reminder_settings;
CREATE POLICY "Users manage their settings" ON reminder_settings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their reminders" ON reminders;
CREATE POLICY "Users manage their reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their notifications" ON reminder_notifications;
CREATE POLICY "Users view their notifications" ON reminder_notifications 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reminders WHERE id = reminder_notifications.reminder_id AND user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_category ON reminders(category);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user_id ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_notifications_reminder_id ON reminder_notifications(reminder_id);

-- Function to get upcoming reminders
CREATE OR REPLACE FUNCTION get_upcoming_reminders(user_uuid UUID, days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  status TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.category,
    r.title,
    r.description,
    r.due_date,
    r.priority,
    r.status,
    EXTRACT(DAY FROM (r.due_date - NOW()))::INTEGER as days_until
  FROM reminders r
  WHERE r.user_id = user_uuid
    AND r.status = 'pending'
    AND r.due_date BETWEEN NOW() AND NOW() + (days_ahead || ' days')::INTERVAL
  ORDER BY r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue reminders
CREATE OR REPLACE FUNCTION get_overdue_reminders(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.category,
    r.title,
    r.description,
    r.due_date,
    r.priority,
    EXTRACT(DAY FROM (NOW() - r.due_date))::INTEGER as days_overdue
  FROM reminders r
  WHERE r.user_id = user_uuid
    AND r.status = 'pending'
    AND r.due_date < NOW()
  ORDER BY r.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
