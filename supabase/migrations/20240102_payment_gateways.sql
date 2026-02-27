-- Payment Gateway Settings
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  paystack_enabled BOOLEAN DEFAULT false,
  paystack_public_key TEXT,
  paystack_secret_key TEXT,
  flutterwave_enabled BOOLEAN DEFAULT false,
  flutterwave_public_key TEXT,
  flutterwave_secret_key TEXT,
  preferred_gateway TEXT DEFAULT 'paystack', -- 'paystack' or 'flutterwave'
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_gateway_user_id ON payment_gateway_settings(user_id);

ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment settings"
  ON payment_gateway_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment settings"
  ON payment_gateway_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment settings"
  ON payment_gateway_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Payment Transactions Log
CREATE TABLE IF NOT EXISTS payment_transactions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_invoice_id TEXT, -- Store invoice ID as text (no foreign key)
  gateway TEXT NOT NULL, -- 'paystack', 'flutterwave', 'manual'
  transaction_reference TEXT UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  payment_method TEXT, -- 'card', 'bank_transfer', 'ussd', etc.
  customer_email TEXT,
  customer_name TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_log_user_id ON payment_transactions_log(user_id);
CREATE INDEX idx_payment_transactions_log_invoice_id ON payment_transactions_log(related_invoice_id);
CREATE INDEX idx_payment_transactions_log_reference ON payment_transactions_log(transaction_reference);
CREATE INDEX idx_payment_transactions_log_status ON payment_transactions_log(status);

ALTER TABLE payment_transactions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions log"
  ON payment_transactions_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions log"
  ON payment_transactions_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment transactions log"
  ON payment_transactions_log FOR UPDATE
  USING (auth.uid() = user_id);
