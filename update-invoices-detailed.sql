-- Drop old constraint first
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Update invoices table with detailed fields
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing status values to match new constraint
UPDATE public.invoices SET status = 'due' WHERE status = 'pending';
UPDATE public.invoices SET status = 'paid' WHERE status = 'cancelled';

-- Add new status check constraint to only allow: due, overdue, paid
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('due', 'overdue', 'paid'));
