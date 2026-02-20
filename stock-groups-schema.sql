-- Product Groups table
CREATE TABLE IF NOT EXISTS public.product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group_id to stock table
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.product_groups(id) ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own groups" ON public.product_groups FOR ALL USING (auth.uid() = user_id);
