-- Chat Messages Table for WhatsApp Chatbot Conversations

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_chatbot_phone ON chat_messages(chatbot_id, phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_phone ON chat_messages(phone_number);

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chatbot messages"
  ON chat_messages FOR SELECT
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);
