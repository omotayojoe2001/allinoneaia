-- Add payment_date column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS payment_date DATE;
