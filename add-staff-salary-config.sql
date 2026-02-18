-- Add salary calculation fields to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS payment_cycle TEXT DEFAULT 'monthly' CHECK (payment_cycle IN ('daily', 'weekly', 'biweekly', 'monthly'));
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS include_weekends BOOLEAN DEFAULT false;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS late_deduction_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auto_deduct_late BOOLEAN DEFAULT false;
