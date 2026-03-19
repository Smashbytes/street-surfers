-- =====================================================
-- STREET SURFERS - FULL MIGRATION SCRIPT (IDEMPOTENT)
-- Runs on a Supabase project SHARED with the Driver's App.
--
-- Many tables already exist with incompatible schemas.
-- Strategy:
--   Existing tables  → ALTER TABLE ADD COLUMN IF NOT EXISTS
--   New tables only  → CREATE TABLE IF NOT EXISTS
--
-- KEY RENAMES vs original design:
--   'passengers'           → 'passenger_profiles'  (Driver's App 'passengers' = trip manifest)
--   trip_passengers.passenger_id (Driver's App FK)
--                          → trip_passengers.commuter_id (our FK → passenger_profiles)
-- =====================================================


-- =====================================================
-- ENUMS (skip if already exist)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'passenger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trip_type AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trip_status AS ENUM ('scheduled', 'driver_assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.passenger_trip_status AS ENUM ('confirmed', 'picked_up', 'dropped_off', 'no_show', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_log_type AS ENUM ('trip_status', 'passenger_status', 'driver_location', 'sos_alert', 'notification');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =====================================================
-- NEW TABLES (exclusive to Passengers App)
-- These do NOT exist in the Driver's App.
-- Created in dependency order.
-- =====================================================

-- passenger_profiles: auth-linked user account table.
-- Named 'passenger_profiles' because 'passengers' is already taken by the
-- Driver's App (which uses it as a trip manifest with no user_id).
CREATE TABLE IF NOT EXISTS public.passenger_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id TEXT,
  department TEXT,
  home_address TEXT,
  work_address TEXT,
  pickup_notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_status text NOT NULL DEFAULT 'active' CHECK (payment_status IN ('active', 'unpaid', 'pending')),
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  ride_type text NOT NULL DEFAULT 'dual' CHECK (ride_type IN ('inbound', 'outbound', 'dual')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  home_lat numeric,
  home_lng numeric,
  work_lat numeric,
  work_lng numeric,
  company text,
  shift_type text DEFAULT 'day' CHECK (shift_type IN ('day', 'night', 'rotational')),
  company_id uuid REFERENCES public.companies(id),
  home_house_number text,
  home_street text,
  home_suburb text,
  home_city text,
  home_province text,
  address_confidence text DEFAULT 'street-level',
  passenger_type text NOT NULL DEFAULT 'staff' CHECK (passenger_type IN ('staff', 'scholar')),
  is_minor boolean NOT NULL DEFAULT false,
  school_address text,
  school_lat numeric,
  school_lng numeric,
  school_street text,
  school_suburb text,
  school_city text,
  school_province text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- branches (new — Driver's App has no branches table)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  street TEXT NOT NULL,
  building_note TEXT,
  suburb TEXT,
  city TEXT,
  province TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- schools (new)
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  street text NOT NULL,
  building_note text,
  suburb text,
  city text,
  province text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  verification_status text NOT NULL DEFAULT 'verified',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add FK columns to passenger_profiles now that branches and schools exist
ALTER TABLE public.passenger_profiles
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- status_logs (new — Driver's App has safety_logs, not status_logs)
CREATE TABLE IF NOT EXISTS public.status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type status_log_type NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- availability_requests (new)
CREATE TABLE IF NOT EXISTS public.availability_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  inbound_time time,
  outbound_time time,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date,
  notes text,
  week_start DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(passenger_id, day_of_week, effective_from)
);

-- scholar_profiles (new — Driver's App has 'guardians', not scholar_profiles)
CREATE TABLE IF NOT EXISTS public.scholar_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE UNIQUE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name text,
  grade_year text,
  guardian_full_name text NOT NULL,
  guardian_phone text NOT NULL,
  guardian_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);


-- =====================================================
-- ADD COLUMNS TO EXISTING SHARED TABLES
-- All use IF NOT EXISTS — safe to re-run.
-- =====================================================

-- profiles: Driver's App uses 'name' (NOT NULL). We add 'full_name' and 'avatar_url'
-- so our app code works. handle_new_user populates both name and full_name.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- drivers: Driver's App has no user_id. We add it (nullable) so drivers who
-- sign up via auth can be linked. Also add vehicle detail columns our app needs.
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
  ADD COLUMN IF NOT EXISTS license_plate TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;

-- trips: Driver's App has trip_date (NOT NULL) and scheduled_start_time (NOT NULL) with
-- no defaults. We add defaults so our inserts don't need to provide those columns.
ALTER TABLE public.trips
  ALTER COLUMN trip_date SET DEFAULT CURRENT_DATE;
DO $$ BEGIN
  ALTER TABLE public.trips ALTER COLUMN scheduled_start_time SET DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

-- Add our Passengers App columns alongside Driver's App columns.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_type public.trip_type,
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS pickup_time_window_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS origin_address TEXT,
  ADD COLUMN IF NOT EXISTS destination_address TEXT,
  ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11, 8);

-- trip_passengers: Driver's App passenger_id FK → Driver's App 'passengers' (trip manifest).
-- We add commuter_id → passenger_profiles (our auth-linked user accounts).
-- The two FKs serve different purposes and coexist on the same table.
ALTER TABLE public.trip_passengers
  ADD COLUMN IF NOT EXISTS commuter_id UUID REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pickup_address TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_address TEXT,
  ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS seat_number INTEGER,
  ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dropoff_time TIMESTAMP WITH TIME ZONE;

-- driver_locations: Driver's App uses last_updated. We add recorded_at (our app uses it),
-- plus trip_id and accuracy.
ALTER TABLE public.driver_locations
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- companies: add verification_status (safe IF NOT EXISTS)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'verified';

-- user_roles: add unique constraint (safe — skips if already exists)
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
EXCEPTION WHEN others THEN NULL; END $$;


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- New tables
ALTER TABLE public.passenger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_profiles ENABLE ROW LEVEL SECURITY;

-- Existing shared tables (safe to enable multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- get_passenger_id: looks up passenger_profiles (NOT the Driver's App 'passengers' table)
CREATE OR REPLACE FUNCTION public.get_passenger_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.passenger_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- get_driver_id: looks up drivers by user_id column we added above
CREATE OR REPLACE FUNCTION public.get_driver_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.drivers WHERE user_id = _user_id LIMIT 1
$$;

-- handle_new_user: fires on auth.users INSERT
-- Creates: profiles row, passenger_profiles row, user_roles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_phone text;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_phone     := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- profiles: Driver's App requires 'name' NOT NULL and 'is_online' NOT NULL.
  -- We populate both 'name' (Driver's App column) and 'full_name' (our column).
  INSERT INTO public.profiles (user_id, email, name, full_name, phone, is_online)
  SELECT NEW.id, NEW.email, v_full_name, v_full_name, v_phone, false
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id);

  -- passenger_profiles: our user-account table
  INSERT INTO public.passenger_profiles (
    user_id, employee_id, department, home_address,
    onboarding_completed, is_active, account_status, payment_status, ride_type
  )
  SELECT
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'employee_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'home_address', ''),
    false, true, 'active', 'active', 'dual'
  WHERE NOT EXISTS (SELECT 1 FROM public.passenger_profiles WHERE user_id = NEW.id);

  -- user_roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, 'passenger'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'passenger'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =====================================================
-- TRIGGERS (DROP IF EXISTS first)
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_passenger_profiles_updated_at ON public.passenger_profiles;
CREATE TRIGGER update_passenger_profiles_updated_at
  BEFORE UPDATE ON public.passenger_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_passengers_updated_at ON public.trip_passengers;
CREATE TRIGGER update_trip_passengers_updated_at
  BEFORE UPDATE ON public.trip_passengers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_requests_updated_at ON public.availability_requests;
CREATE TRIGGER update_availability_requests_updated_at
  BEFORE UPDATE ON public.availability_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scholar_profiles_updated_at ON public.scholar_profiles;
CREATE TRIGGER update_scholar_profiles_updated_at
  BEFORE UPDATE ON public.scholar_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- RLS POLICIES (DROP IF EXISTS first)
-- =====================================================

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- passenger_profiles
DROP POLICY IF EXISTS "Passengers can view their own record" ON public.passenger_profiles;
CREATE POLICY "Passengers can view their own record" ON public.passenger_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Passengers can update their own record" ON public.passenger_profiles;
CREATE POLICY "Passengers can update their own record" ON public.passenger_profiles FOR UPDATE USING (auth.uid() = user_id);

-- drivers
DROP POLICY IF EXISTS "Drivers can view their own record" ON public.drivers;
CREATE POLICY "Drivers can view their own record" ON public.drivers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can update their own record" ON public.drivers;
CREATE POLICY "Drivers can update their own record" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Passengers can view driver info for their trips" ON public.drivers;
CREATE POLICY "Passengers can view driver info for their trips" ON public.drivers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.trip_passengers tp ON tp.trip_id = t.id
    WHERE t.driver_id = drivers.id
    AND tp.commuter_id = public.get_passenger_id(auth.uid())
  )
);

-- trips
DROP POLICY IF EXISTS "Passengers can view their assigned trips" ON public.trips;
CREATE POLICY "Passengers can view their assigned trips" ON public.trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_passengers tp
    WHERE tp.trip_id = trips.id
    AND tp.commuter_id = public.get_passenger_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Drivers can view their assigned trips" ON public.trips;
CREATE POLICY "Drivers can view their assigned trips" ON public.trips FOR SELECT
USING (driver_id = public.get_driver_id(auth.uid()));

DROP POLICY IF EXISTS "Drivers can update their assigned trips" ON public.trips;
CREATE POLICY "Drivers can update their assigned trips" ON public.trips FOR UPDATE
USING (driver_id = public.get_driver_id(auth.uid()));

-- trip_passengers: use commuter_id (our FK) for passenger-side queries
DROP POLICY IF EXISTS "Passengers can view their trip assignments" ON public.trip_passengers;
CREATE POLICY "Passengers can view their trip assignments" ON public.trip_passengers FOR SELECT
USING (commuter_id = public.get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Passengers can update their own trip status" ON public.trip_passengers;
CREATE POLICY "Passengers can update their own trip status" ON public.trip_passengers FOR UPDATE
USING (commuter_id = public.get_passenger_id(auth.uid()));

-- driver_locations
DROP POLICY IF EXISTS "Passengers can view driver location for their active trips" ON public.driver_locations;
CREATE POLICY "Passengers can view driver location for their active trips" ON public.driver_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.trip_passengers tp ON tp.trip_id = t.id
    WHERE t.driver_id = driver_locations.driver_id
    AND tp.commuter_id = public.get_passenger_id(auth.uid())
    AND t.status IN ('driver_assigned', 'in_progress')
  )
);

DROP POLICY IF EXISTS "Drivers can insert their own location" ON public.driver_locations;
CREATE POLICY "Drivers can insert their own location" ON public.driver_locations FOR INSERT
WITH CHECK (driver_id = public.get_driver_id(auth.uid()));

DROP POLICY IF EXISTS "Drivers can view their own locations" ON public.driver_locations;
CREATE POLICY "Drivers can view their own locations" ON public.driver_locations FOR SELECT
USING (driver_id = public.get_driver_id(auth.uid()));

-- status_logs
DROP POLICY IF EXISTS "Users can view their own status logs" ON public.status_logs;
CREATE POLICY "Users can view their own status logs" ON public.status_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own status logs" ON public.status_logs;
CREATE POLICY "Users can insert their own status logs" ON public.status_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- companies
DROP POLICY IF EXISTS "Authenticated users can view active companies" ON public.companies;
CREATE POLICY "Authenticated users can view active companies" ON public.companies FOR SELECT
USING (auth.role() = 'authenticated');
-- is_active omitted: Driver's App companies schema has no is_active column

DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- branches
DROP POLICY IF EXISTS "Authenticated users can view active branches" ON public.branches;
CREATE POLICY "Authenticated users can view active branches" ON public.branches FOR SELECT
TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can insert branches" ON public.branches;
CREATE POLICY "Authenticated users can insert branches" ON public.branches FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- schools
DROP POLICY IF EXISTS "Authenticated users can view active schools" ON public.schools;
CREATE POLICY "Authenticated users can view active schools" ON public.schools FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Authenticated users can insert schools" ON public.schools;
CREATE POLICY "Authenticated users can insert schools" ON public.schools FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- availability_requests
DROP POLICY IF EXISTS "Passengers can view their own availability" ON public.availability_requests;
CREATE POLICY "Passengers can view their own availability" ON public.availability_requests FOR SELECT
USING (passenger_id = get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Passengers can insert their own availability" ON public.availability_requests;
CREATE POLICY "Passengers can insert their own availability" ON public.availability_requests FOR INSERT
WITH CHECK (passenger_id = get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Passengers can update their own pending availability" ON public.availability_requests;
CREATE POLICY "Passengers can update their own pending availability" ON public.availability_requests FOR UPDATE
USING (passenger_id = get_passenger_id(auth.uid()) AND status = 'pending');

DROP POLICY IF EXISTS "Passengers can delete their own pending availability" ON public.availability_requests;
CREATE POLICY "Passengers can delete their own pending availability" ON public.availability_requests FOR DELETE
USING (passenger_id = get_passenger_id(auth.uid()) AND status = 'pending');

-- scholar_profiles
DROP POLICY IF EXISTS "Passengers can view their own scholar profile" ON public.scholar_profiles;
CREATE POLICY "Passengers can view their own scholar profile" ON public.scholar_profiles FOR SELECT
USING (passenger_id = get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Passengers can insert their own scholar profile" ON public.scholar_profiles;
CREATE POLICY "Passengers can insert their own scholar profile" ON public.scholar_profiles FOR INSERT
WITH CHECK (passenger_id = get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Passengers can update their own scholar profile" ON public.scholar_profiles;
CREATE POLICY "Passengers can update their own scholar profile" ON public.scholar_profiles FOR UPDATE
USING (passenger_id = get_passenger_id(auth.uid()));

DROP POLICY IF EXISTS "Drivers can view scholar profiles for their trips" ON public.scholar_profiles;
CREATE POLICY "Drivers can view scholar profiles for their trips" ON public.scholar_profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trips t
  JOIN public.trip_passengers tp ON tp.trip_id = t.id
  WHERE tp.commuter_id = scholar_profiles.passenger_id
    AND t.driver_id = get_driver_id(auth.uid())
    AND t.status IN ('driver_assigned', 'in_progress')
));


-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_date ON public.trips(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_trip_id ON public.trip_passengers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_commuter_id ON public.trip_passengers(commuter_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON public.driver_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_logs_user_id ON public.status_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_log_type ON public.status_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_status_logs_created_at ON public.status_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passenger_profiles_user_id ON public.passenger_profiles(user_id);


-- =====================================================
-- REALTIME (ignore if already added)
-- =====================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_passengers;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.status_logs;
EXCEPTION WHEN others THEN NULL; END $$;


-- =====================================================
-- SEED: ICE companies (only if not already present)
-- Uses Driver's App companies schema (name, address, is_school)
-- =====================================================
INSERT INTO public.companies (name, address, is_school)
SELECT * FROM (VALUES
  ('ICE'::text, 'Rivonia Road, Sandton, Johannesburg, Gauteng'::text, false),
  ('ICE'::text, 'Waterfall Drive, Midrand, Johannesburg, Gauteng'::text, false),
  ('ICE'::text, 'Oxford Road, Rosebank, Johannesburg, Gauteng'::text, false)
) AS v(name, address, is_school)
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE name = 'ICE' AND address = v.address
);

-- NOTE: Auto-create branches from companies omitted — companies table uses Driver's App
-- schema (no street/lat/lng). Branches are created explicitly via DATA_IMPORT.sql.
