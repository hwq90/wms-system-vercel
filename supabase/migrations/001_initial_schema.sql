-- WMS 仓库管理系统数据库结构
-- 在 Supabase SQL Editor 中执行

-- 启用 RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建物料表
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  spec TEXT,
  unit TEXT DEFAULT '件',
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 99999,
  barcode TEXT,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建仓库表
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  manager TEXT,
  phone TEXT,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建库位表
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  zone TEXT,
  shelf TEXT,
  layer TEXT,
  position TEXT,
  capacity INTEGER DEFAULT 999,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, warehouse_id)
);

-- 创建库存表
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 0,
  batch_no TEXT,
  production_date DATE,
  expiry_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建供应商表
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  warehouse_id UUID REFERENCES public.warehouses(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount DECIMAL(10,2),
  remark TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建订单明细表
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2),
  location_id UUID REFERENCES public.locations(id),
  batch_no TEXT,
  remark TEXT
);

-- 创建库存流水表
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materials(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  location_id UUID REFERENCES public.locations(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'transfer')),
  quantity INTEGER NOT NULL,
  before_qty INTEGER,
  after_qty INTEGER,
  order_no TEXT,
  batch_no TEXT,
  operator_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认超级管理员
INSERT INTO public.users (username, password, name, role, remark)
VALUES ('hwq', '568394', '超级管理员', 'admin', '系统默认超级管理员')
ON CONFLICT (username) DO NOTHING;

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 (允许所有已认证用户访问)
CREATE POLICY "Allow all" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.materials FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.locations FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.inventory_logs FOR ALL USING (true);

-- 创建索引
CREATE INDEX idx_materials_code ON public.materials(code);
CREATE INDEX idx_materials_name ON public.materials(name);
CREATE INDEX idx_inventory_material ON public.inventory(material_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory(warehouse_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_type ON public.orders(type);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
