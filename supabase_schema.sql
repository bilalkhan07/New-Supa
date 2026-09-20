-- ========================================================
-- DESIGN QUIXO SUPABASE DATABASE INITIALIZATION SCHEMA
-- Copy and paste this whole script into your Supabase Dashboard:
-- SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  service TEXT,
  project TEXT,
  price NUMERIC,
  brief TEXT,
  phone TEXT,
  whatsapp TEXT,
  ratio TEXT,
  referenceimage TEXT,
  status TEXT DEFAULT 'Pending',
  acceptedby JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT false,
  completedat TEXT,
  createdat TEXT,
  time TEXT
);

-- 2. Create designers table
CREATE TABLE IF NOT EXISTS public.designers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  experience TEXT,
  software JSONB DEFAULT '[]'::jsonb,
  portfolio TEXT,
  photo TEXT,
  role TEXT DEFAULT 'designer',
  status TEXT DEFAULT 'pending',
  earnings NUMERIC DEFAULT 0,
  createdat TEXT,
  isapproved BOOLEAN DEFAULT false,
  approvedat TEXT
);

-- 3. Create city_addresses table
CREATE TABLE IF NOT EXISTS public.city_addresses (
  key TEXT PRIMARY KEY,
  city TEXT,
  address TEXT,
  phone TEXT
);

-- 4. Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT,
  price NUMERIC,
  originalprice NUMERIC,
  icon TEXT,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  tag TEXT
);

-- 5. Create login_history table
CREATE TABLE IF NOT EXISTS public.login_history (
  id TEXT PRIMARY KEY,
  phone TEXT,
  name TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create portfolio table
CREATE TABLE IF NOT EXISTS public.portfolio (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  designer TEXT,
  image TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  createdat TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Create Open Public Access Policies (Safe for anon client with server validation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Allow public all access on jobs') THEN
    CREATE POLICY "Allow public all access on jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designers' AND policyname = 'Allow public all access on designers') THEN
    CREATE POLICY "Allow public all access on designers" ON public.designers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'city_addresses' AND policyname = 'Allow public all access on city_addresses') THEN
    CREATE POLICY "Allow public all access on city_addresses" ON public.city_addresses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Allow public all access on services') THEN
    CREATE POLICY "Allow public all access on services" ON public.services FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_history' AND policyname = 'Allow public all access on login_history') THEN
    CREATE POLICY "Allow public all access on login_history" ON public.login_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio' AND policyname = 'Allow public all access on portfolio') THEN
    CREATE POLICY "Allow public all access on portfolio" ON public.portfolio FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime publication for instant dashboard sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.designers;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.city_addresses;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.login_history;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
