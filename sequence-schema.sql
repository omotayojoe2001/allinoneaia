-- Email Sequences table
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  list_id UUID REFERENCES public.email_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence Steps table
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_minutes INTEGER NOT NULL,
  email_subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriber Sequence Progress table
CREATE TABLE IF NOT EXISTS public.subscriber_sequence_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  UNIQUE(subscriber_id, sequence_id)
);

-- RLS for email_sequences
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sequences" ON public.email_sequences FOR ALL USING (auth.uid() = user_id);

-- RLS for sequence_steps
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sequence steps" ON public.sequence_steps FOR ALL USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_id AND email_sequences.user_id = auth.uid()));

-- RLS for subscriber_sequence_progress
ALTER TABLE public.subscriber_sequence_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.subscriber_sequence_progress FOR ALL USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_id AND email_sequences.user_id = auth.uid()));
