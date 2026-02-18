-- Add owing fields to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS amount_owed_to_us DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS amount_we_owe DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS owed_to_us_due_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS we_owe_due_date DATE;
