-- Payroll Configuration
CREATE TABLE IF NOT EXISTS payroll_config_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_pension_pin TEXT,
  company_tax_id TEXT,
  paye_enabled BOOLEAN DEFAULT true,
  pension_enabled BOOLEAN DEFAULT true,
  pension_rate_employee DECIMAL(5,2) DEFAULT 8.0,
  pension_rate_employer DECIMAL(5,2) DEFAULT 10.0,
  nhf_enabled BOOLEAN DEFAULT false, -- National Housing Fund
  nhf_rate DECIMAL(5,2) DEFAULT 2.5,
  nsitf_enabled BOOLEAN DEFAULT false, -- Industrial Training Fund
  nsitf_rate DECIMAL(5,2) DEFAULT 1.0,
  payroll_day INTEGER DEFAULT 25, -- Day of month for payroll
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payroll_config_user_id ON payroll_config_settings(user_id);

ALTER TABLE payroll_config_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payroll config"
  ON payroll_config_settings FOR ALL
  USING (auth.uid() = user_id);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_number TEXT UNIQUE NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  total_gross DECIMAL(15,2) DEFAULT 0,
  total_paye DECIMAL(15,2) DEFAULT 0,
  total_pension_employee DECIMAL(15,2) DEFAULT 0,
  total_pension_employer DECIMAL(15,2) DEFAULT 0,
  total_net DECIMAL(15,2) DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'paid', 'cancelled'
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payroll_runs_user_id ON payroll_runs_history(user_id);
CREATE INDEX idx_payroll_runs_period ON payroll_runs_history(period_month, period_year);
CREATE INDEX idx_payroll_runs_status ON payroll_runs_history(status);

ALTER TABLE payroll_runs_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payroll runs"
  ON payroll_runs_history FOR ALL
  USING (auth.uid() = user_id);

-- Payslips
CREATE TABLE IF NOT EXISTS generated_payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payroll_run_id UUID REFERENCES payroll_runs_history(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  basic_salary DECIMAL(15,2) DEFAULT 0,
  housing_allowance DECIMAL(15,2) DEFAULT 0,
  transport_allowance DECIMAL(15,2) DEFAULT 0,
  other_allowances DECIMAL(15,2) DEFAULT 0,
  gross_salary DECIMAL(15,2) DEFAULT 0,
  consolidated_relief DECIMAL(15,2) DEFAULT 0,
  taxable_income DECIMAL(15,2) DEFAULT 0,
  paye_tax DECIMAL(15,2) DEFAULT 0,
  pension_employee DECIMAL(15,2) DEFAULT 0,
  pension_employer DECIMAL(15,2) DEFAULT 0,
  nhf_deduction DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) DEFAULT 0,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payslips_user_id ON generated_payslips(user_id);
CREATE INDEX idx_payslips_staff_id ON generated_payslips(staff_id);
CREATE INDEX idx_payslips_period ON generated_payslips(period_month, period_year);
CREATE INDEX idx_payslips_run_id ON generated_payslips(payroll_run_id);

ALTER TABLE generated_payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payslips"
  ON generated_payslips FOR ALL
  USING (auth.uid() = user_id);

-- Tax Remittance Schedule
CREATE TABLE IF NOT EXISTS tax_remittance_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remittance_type TEXT NOT NULL, -- 'paye', 'pension', 'nhf', 'nsitf'
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_remittance_user_id ON tax_remittance_schedule(user_id);
CREATE INDEX idx_tax_remittance_type ON tax_remittance_schedule(remittance_type);
CREATE INDEX idx_tax_remittance_due ON tax_remittance_schedule(due_date);
CREATE INDEX idx_tax_remittance_status ON tax_remittance_schedule(status);

ALTER TABLE tax_remittance_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tax remittances"
  ON tax_remittance_schedule FOR ALL
  USING (auth.uid() = user_id);

-- Leave Management
CREATE TABLE IF NOT EXISTS staff_leave_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  leave_type TEXT NOT NULL, -- 'annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leave_records_user_id ON staff_leave_records(user_id);
CREATE INDEX idx_leave_records_staff_id ON staff_leave_records(staff_id);
CREATE INDEX idx_leave_records_status ON staff_leave_records(status);
CREATE INDEX idx_leave_records_dates ON staff_leave_records(start_date, end_date);

ALTER TABLE staff_leave_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own leave records"
  ON staff_leave_records FOR ALL
  USING (auth.uid() = user_id);
