-- Invoice Reminders System
CREATE TABLE IF NOT EXISTS invoice_reminders_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  reminder_before_due INTEGER DEFAULT 3, -- days before due date
  reminder_on_due BOOLEAN DEFAULT true,
  reminder_after_due_1 INTEGER DEFAULT 7, -- days after due date
  reminder_after_due_2 INTEGER DEFAULT 14,
  auto_send BOOLEAN DEFAULT false,
  email_template TEXT,
  whatsapp_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_reference TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  reminder_type TEXT NOT NULL, -- 'before_due', 'on_due', 'after_due_1', 'after_due_2'
  sent_via TEXT, -- 'email', 'whatsapp', 'both'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_reminders_config_user_id ON invoice_reminders_config(user_id);
CREATE INDEX idx_invoice_reminder_logs_user_id ON invoice_reminder_logs(user_id);
CREATE INDEX idx_invoice_reminder_logs_reference ON invoice_reminder_logs(invoice_reference);
CREATE INDEX idx_invoice_reminder_logs_status ON invoice_reminder_logs(status);

ALTER TABLE invoice_reminders_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminder config"
  ON invoice_reminders_config FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own reminder logs"
  ON invoice_reminder_logs FOR ALL
  USING (auth.uid() = user_id);

-- Aging Report Data
CREATE TABLE IF NOT EXISTS invoice_aging_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  current_0_30 DECIMAL(15,2) DEFAULT 0,
  overdue_31_60 DECIMAL(15,2) DEFAULT 0,
  overdue_61_90 DECIMAL(15,2) DEFAULT 0,
  overdue_90_plus DECIMAL(15,2) DEFAULT 0,
  total_outstanding DECIMAL(15,2) DEFAULT 0,
  details JSONB, -- Store breakdown by customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_aging_user_id ON invoice_aging_snapshots(user_id);
CREATE INDEX idx_invoice_aging_date ON invoice_aging_snapshots(snapshot_date);

ALTER TABLE invoice_aging_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own aging snapshots"
  ON invoice_aging_snapshots FOR ALL
  USING (auth.uid() = user_id);
