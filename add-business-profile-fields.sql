-- Add business profile fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_motto TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invoice_theme TEXT DEFAULT 'blue';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
