-- Add payment_link column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_payment_link ON invoices(payment_link);
