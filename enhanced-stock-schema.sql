-- Enhanced Stock/Inventory table
DROP TABLE IF EXISTS public.stock CASCADE;
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  category TEXT,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  supplier TEXT,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  variants JSONB DEFAULT '[]',
  batch_number TEXT,
  expiry_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Movements (Track all stock changes)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES public.stock(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  reason TEXT CHECK (reason IN ('purchase', 'sale', 'return', 'damaged', 'expired', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  from_location TEXT,
  to_location TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders (Stock on delivery)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  supplier TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Sales (Detailed sales tracking)
CREATE TABLE IF NOT EXISTS public.stock_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sale_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stock" ON public.stock FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orders" ON public.purchase_orders FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.stock_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sales" ON public.stock_sales FOR ALL USING (auth.uid() = user_id);
