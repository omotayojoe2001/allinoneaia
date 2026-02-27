-- Contract Templates Library
CREATE TABLE IF NOT EXISTS contract_templates_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'nda', 'service_agreement', 'employment', 'offer_letter', 'freelance', 'partnership', 'rental', 'custom'
  template_content TEXT NOT NULL,
  variables JSONB, -- Array of variable names like ["client_name", "amount", "start_date"]
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_templates_user_id ON contract_templates_library(user_id);
CREATE INDEX idx_contract_templates_type ON contract_templates_library(template_type);

ALTER TABLE contract_templates_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contract templates"
  ON contract_templates_library FOR ALL
  USING (auth.uid() = user_id);

-- Generated Contracts
CREATE TABLE IF NOT EXISTS generated_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES contract_templates_library(id) ON DELETE SET NULL,
  contract_type TEXT NOT NULL,
  contract_title TEXT NOT NULL,
  parties JSONB NOT NULL, -- Array of {name, email, role: 'party_a'/'party_b'}
  contract_content TEXT NOT NULL,
  contract_value DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_signature', 'signed', 'expired', 'cancelled'
  pdf_url TEXT,
  signed_pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generated_contracts_user_id ON generated_contracts(user_id);
CREATE INDEX idx_generated_contracts_status ON generated_contracts(status);
CREATE INDEX idx_generated_contracts_expiry ON generated_contracts(expiry_date);
CREATE INDEX idx_generated_contracts_number ON generated_contracts(contract_number);

ALTER TABLE generated_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contracts"
  ON generated_contracts FOR ALL
  USING (auth.uid() = user_id);

-- Contract Signatures
CREATE TABLE IF NOT EXISTS contract_signatures_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES generated_contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT, -- 'party_a', 'party_b', 'witness'
  signature_data TEXT, -- Base64 signature image or signature ID from provider
  signature_method TEXT DEFAULT 'manual', -- 'manual', 'docusign', 'local'
  ip_address TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_signatures_contract_id ON contract_signatures_log(contract_id);
CREATE INDEX idx_contract_signatures_email ON contract_signatures_log(signer_email);

ALTER TABLE contract_signatures_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view signatures for own contracts"
  ON contract_signatures_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generated_contracts
      WHERE generated_contracts.id = contract_signatures_log.contract_id
      AND generated_contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert signatures"
  ON contract_signatures_log FOR INSERT
  WITH CHECK (true);

-- Contract Expiry Reminders
CREATE TABLE IF NOT EXISTS contract_expiry_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES generated_contracts(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL, -- '30_days', '7_days', 'expired'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_reminders_user_id ON contract_expiry_reminders(user_id);
CREATE INDEX idx_contract_reminders_date ON contract_expiry_reminders(reminder_date);
CREATE INDEX idx_contract_reminders_status ON contract_expiry_reminders(status);

ALTER TABLE contract_expiry_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contract reminders"
  ON contract_expiry_reminders FOR ALL
  USING (auth.uid() = user_id);
