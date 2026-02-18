-- Add currency field to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
