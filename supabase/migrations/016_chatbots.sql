-- Chatbots Table for AI Chatbot Management

-- Add missing columns if table exists
DO $$ 
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chatbots' AND column_name = 'is_active') THEN
    ALTER TABLE chatbots ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add instructions column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chatbots' AND column_name = 'instructions') THEN
    ALTER TABLE chatbots ADD COLUMN instructions TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add knowledge_base column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chatbots' AND column_name = 'knowledge_base') THEN
    ALTER TABLE chatbots ADD COLUMN knowledge_base TEXT;
  END IF;
  
  -- Add model column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chatbots' AND column_name = 'model') THEN
    ALTER TABLE chatbots ADD COLUMN model TEXT DEFAULT 'llama-3.3-70b-versatile';
  END IF;
  
  -- Add temperature column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chatbots' AND column_name = 'temperature') THEN
    ALTER TABLE chatbots ADD COLUMN temperature FLOAT DEFAULT 0.7;
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'telegram', 'web')),
  name TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  knowledge_base TEXT,
  model TEXT DEFAULT 'llama-3.3-70b-versatile',
  temperature FLOAT DEFAULT 0.7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_platform ON chatbots(platform);
CREATE INDEX IF NOT EXISTS idx_chatbots_active ON chatbots(is_active);

-- RLS Policies
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chatbots" ON chatbots;
CREATE POLICY "Users can manage their own chatbots"
  ON chatbots FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can read all chatbots" ON chatbots;
CREATE POLICY "Service role can read all chatbots"
  ON chatbots FOR SELECT
  USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_chatbot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chatbot_timestamp ON chatbots;
CREATE TRIGGER trigger_update_chatbot_timestamp
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_timestamp();
