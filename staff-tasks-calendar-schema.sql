-- Staff List, Task Assignment & Google Calendar Integration Schema

-- Add task assignment fields (use existing staff table)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.staff(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to_self BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Add Google Calendar integration fields
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_calendar_synced BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_calendar_synced BOOLEAN DEFAULT false;

-- Create owner profile table for self-assignment
CREATE TABLE IF NOT EXISTS public.owner_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.owner_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies for owner_profile
CREATE POLICY "Users can view own profile" ON public.owner_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.owner_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.owner_profile FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.owner_profile TO authenticated;
