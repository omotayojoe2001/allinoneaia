-- Proposal Templates
CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB, -- {{client_name}}, {{project_name}}, etc.
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_templates_user ON proposal_templates(user_id);
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own proposal templates" ON proposal_templates FOR ALL USING (auth.uid() = user_id);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  total_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected
  valid_until DATE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own proposals" ON proposals FOR ALL USING (auth.uid() = user_id);

-- Proposal Line Items
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_items_proposal ON proposal_line_items(proposal_id);
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage proposal items" ON proposal_line_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_id AND proposals.user_id = auth.uid()));
