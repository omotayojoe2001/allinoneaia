-- Make kclaut_order_id nullable to allow saving orders even if KClaut API fails
ALTER TABLE social_orders ALTER COLUMN kclaut_order_id DROP NOT NULL;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='social_orders' AND column_name='status') THEN
    ALTER TABLE social_orders ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;
