-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  salary DECIMAL(10,2),
  payment_date DATE,
  payment_cycle TEXT DEFAULT 'monthly',
  include_weekends BOOLEAN DEFAULT false,
  late_deduction_amount DECIMAL(10,2) DEFAULT 0,
  auto_deduct_late BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff_list table
CREATE TABLE IF NOT EXISTS staff_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create salary_payments table
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  month TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users manage their own staff" ON staff FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own staff list" ON staff_list FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own attendance" ON attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own payments" ON salary_payments FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_list_user_id ON staff_list(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_staff_id ON salary_payments(staff_id);
