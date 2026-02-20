-- Business Tools Integration Schema
-- This creates the foundation for connecting all business modules

-- Add reference fields to cashbook_transactions for integration
ALTER TABLE public.cashbook_transactions ADD COLUMN IF NOT EXISTS source_module TEXT;
ALTER TABLE public.cashbook_transactions ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE public.cashbook_transactions ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Add payment tracking to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cashbook_entry_id UUID REFERENCES public.cashbook_transactions(id);

-- Add financial tracking to stock_sales
ALTER TABLE public.stock_sales ADD COLUMN IF NOT EXISTS cashbook_entry_id UUID REFERENCES public.cashbook_transactions(id);
ALTER TABLE public.stock_sales ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2) DEFAULT 0;

-- Add expense tracking to salary_payments
ALTER TABLE public.salary_payments ADD COLUMN IF NOT EXISTS cashbook_entry_id UUID REFERENCES public.cashbook_transactions(id);

-- Create financial summary view for bookkeeping
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  user_id,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance
FROM public.cashbook_transactions
GROUP BY user_id;

-- Create sales dashboard summary view
CREATE OR REPLACE VIEW public.sales_dashboard_summary AS
SELECT 
  c.user_id,
  COALESCE(SUM(CASE WHEN c.type = 'income' THEN c.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN c.type = 'expense' THEN c.amount ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN c.type = 'income' THEN c.amount ELSE -c.amount END), 0) as net_balance,
  (SELECT COUNT(*) FROM public.customers WHERE user_id = c.user_id) as customer_count,
  (SELECT COUNT(*) FROM public.invoices WHERE user_id = c.user_id) as invoice_count,
  (SELECT COUNT(*) FROM public.stock WHERE user_id = c.user_id) as stock_items,
  (SELECT COUNT(*) FROM public.appointments WHERE user_id = c.user_id AND date >= CURRENT_DATE) as upcoming_appointments,
  (SELECT COUNT(*) FROM public.tasks WHERE user_id = c.user_id AND status = 'pending') as pending_tasks
FROM public.cashbook_transactions c
GROUP BY c.user_id;

-- Grant permissions on views
GRANT SELECT ON public.financial_summary TO authenticated;
GRANT SELECT ON public.sales_dashboard_summary TO authenticated;
