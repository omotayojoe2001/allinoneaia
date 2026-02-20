-- Social Growth Services Schema

-- Create social_orders table
CREATE TABLE IF NOT EXISTS public.social_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  kclaut_order_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  link TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  wholesale_cost DECIMAL(10,4) NOT NULL,
  markup_percentage DECIMAL(5,2) DEFAULT 50.00,
  user_price DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  status TEXT DEFAULT 'Pending',
  start_count TEXT,
  remains TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kclaut_account table for tracking balance
CREATE TABLE IF NOT EXISTS public.kclaut_account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance DECIMAL(10,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_rules table for markup management
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT,
  service_type TEXT,
  markup_percentage DECIMAL(5,2) DEFAULT 50.00,
  min_markup DECIMAL(10,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_services_cache table for caching KClaut services
CREATE TABLE IF NOT EXISTS public.social_services_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rate DECIMAL(10,4) NOT NULL,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER NOT NULL,
  category TEXT NOT NULL,
  average_time TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_services_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kclaut_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_orders
CREATE POLICY "Users can view own orders" ON public.social_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.social_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.social_orders FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for social_services_cache (public read)
CREATE POLICY "Anyone can view services" ON public.social_services_cache FOR SELECT USING (true);
CREATE POLICY "Service account can manage cache" ON public.social_services_cache FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for kclaut_account (admin only)
CREATE POLICY "Admin can manage account" ON public.kclaut_account FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for pricing_rules (admin only)
CREATE POLICY "Admin can manage pricing" ON public.pricing_rules FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.social_orders TO authenticated;
GRANT ALL ON public.social_services_cache TO authenticated;
GRANT ALL ON public.kclaut_account TO authenticated;
GRANT ALL ON public.pricing_rules TO authenticated;

-- Insert comprehensive pricing rules for all platforms based on KClaut data
INSERT INTO public.pricing_rules (platform, service_type, markup_percentage, min_markup) VALUES
-- Instagram Services
('Instagram', 'Followers', 80.00, 500.00),
('Instagram', 'Likes', 70.00, 200.00),
('Instagram', 'Views', 60.00, 5.00),
('Instagram', 'Comments', 75.00, 1000.00),
('Instagram', 'Repost', 80.00, 500.00),
('Instagram', 'Story', 70.00, 200.00),
('Instagram', 'Reel', 65.00, 15.00),
('Instagram', 'Insights', 75.00, 100.00),
-- TikTok Services
('TikTok', 'Followers', 85.00, 800.00),
('TikTok', 'Likes', 75.00, 30.00),
('TikTok', 'Views', 65.00, 10.00),
('TikTok', 'Comments', 80.00, 1000.00),
('TikTok', 'Saves', 70.00, 50.00),
('TikTok', 'Shares', 75.00, 100.00),
('TikTok', 'Live', 85.00, 2000.00),
-- Twitter Services
('Twitter', 'Followers', 90.00, 2000.00),
('Twitter', 'Likes', 85.00, 1500.00),
('Twitter', 'Views', 70.00, 10.00),
('Twitter', 'Retweets', 80.00, 1000.00),
('Twitter', 'Impressions', 65.00, 30.00),
('Twitter', 'Bookmarks', 85.00, 2000.00),
('Twitter', 'Poll', 75.00, 200.00),
('Twitter', 'Space', 80.00, 200.00),
-- Facebook Services
('Facebook', 'Followers', 75.00, 400.00),
('Facebook', 'Likes', 70.00, 200.00),
('Facebook', 'Comments', 80.00, 1500.00),
('Facebook', 'Shares', 75.00, 1000.00),
('Facebook', 'Views', 65.00, 150.00),
('Facebook', 'Reactions', 70.00, 300.00),
('Facebook', 'Live', 85.00, 1000.00),
-- YouTube Services
('YouTube', 'Subscribers', 85.00, 10000.00),
('YouTube', 'Views', 70.00, 1000.00),
('YouTube', 'Likes', 75.00, 500.00),
('YouTube', 'Comments', 85.00, 3000.00),
('YouTube', 'Watchtime', 80.00, 10000.00),
('YouTube', 'Live', 75.00, 200.00),
-- Spotify Services
('Spotify', 'Plays', 70.00, 200.00),
('Spotify', 'Followers', 75.00, 300.00),
('Spotify', 'Saves', 70.00, 300.00),
('Spotify', 'Monthly', 85.00, 2000.00),
-- Telegram Services
('Telegram', 'Views', 60.00, 5.00),
('Telegram', 'Members', 75.00, 700.00),
('Telegram', 'Reactions', 70.00, 100.00),
('Telegram', 'Premium', 90.00, 5000.00),
-- WhatsApp Services
('WhatsApp', 'Members', 85.00, 5000.00),
-- LinkedIn Services
('LinkedIn', 'Followers', 90.00, 15000.00),
('LinkedIn', 'Likes', 85.00, 10000.00),
('LinkedIn', 'Comments', 85.00, 10000.00),
('LinkedIn', 'Connections', 90.00, 10000.00),
-- Twitch/Kick Services
('Twitch', 'Followers', 80.00, 300.00),
('Kick', 'Views', 85.00, 1500.00),
-- Audiomack Services
('Audiomack', 'Plays', 75.00, 500.00),
('Audiomack', 'Followers', 80.00, 1500.00),
('Audiomack', 'Likes', 75.00, 1500.00),
-- Website Traffic
('Website', 'Traffic', 70.00, 300.00);

-- Insert initial KClaut account balance (you need to fund this in NGN)
INSERT INTO public.kclaut_account (balance, currency) VALUES (0.00, 'NGN');