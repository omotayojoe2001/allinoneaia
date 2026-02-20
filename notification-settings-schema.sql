-- Notification Settings Schema for All Business Modules

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  
  -- Appointment Settings
  appointment_notifications_enabled BOOLEAN DEFAULT true,
  appointment_reminder_times TEXT[] DEFAULT ARRAY['1440', '60', '30'], -- minutes before (1 day, 1 hour, 30 min)
  appointment_whatsapp BOOLEAN DEFAULT true,
  appointment_email BOOLEAN DEFAULT true,
  appointment_google_calendar BOOLEAN DEFAULT true,
  
  -- Stock Management Settings
  stock_low_stock_alerts BOOLEAN DEFAULT true,
  stock_low_stock_threshold INTEGER DEFAULT 10,
  stock_reorder_notifications BOOLEAN DEFAULT true,
  
  -- Staff Management Settings
  staff_payment_reminders BOOLEAN DEFAULT true,
  staff_payment_reminder_days INTEGER DEFAULT 3, -- days before payment date
  staff_attendance_alerts BOOLEAN DEFAULT true,
  
  -- Invoice Settings
  invoice_payment_reminders BOOLEAN DEFAULT true,
  invoice_reminder_days INTEGER DEFAULT 3, -- days before due date
  invoice_overdue_alerts BOOLEAN DEFAULT true,
  
  -- Customer Settings
  customer_birthday_reminders BOOLEAN DEFAULT false,
  customer_followup_alerts BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.notification_settings TO authenticated;
