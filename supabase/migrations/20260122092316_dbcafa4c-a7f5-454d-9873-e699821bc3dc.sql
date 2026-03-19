-- Create schools table first (similar structure to companies)
CREATE TABLE public.schools (
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

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- RLS policies for schools (similar to companies)
CREATE POLICY "Authenticated users can view active schools"
ON public.schools
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Authenticated users can insert schools"
ON public.schools
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at on schools
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add passenger_type and is_minor to passengers table
ALTER TABLE public.passengers 
ADD COLUMN passenger_type text NOT NULL DEFAULT 'staff',
ADD COLUMN is_minor boolean NOT NULL DEFAULT false;

-- Add validation constraint for passenger_type
ALTER TABLE public.passengers 
ADD CONSTRAINT passengers_passenger_type_check CHECK (passenger_type IN ('staff', 'scholar'));

-- Add school_id for scholar passengers
ALTER TABLE public.passengers 
ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- Add school address columns to passengers (for scholars)
ALTER TABLE public.passengers 
ADD COLUMN school_address text,
ADD COLUMN school_lat numeric,
ADD COLUMN school_lng numeric,
ADD COLUMN school_street text,
ADD COLUMN school_suburb text,
ADD COLUMN school_city text,
ADD COLUMN school_province text;

-- Create scholar_profiles table for guardian info
CREATE TABLE public.scholar_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE UNIQUE,
  school_name text,
  grade_year text,
  guardian_full_name text NOT NULL,
  guardian_phone text NOT NULL,
  guardian_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on scholar_profiles
ALTER TABLE public.scholar_profiles ENABLE ROW LEVEL SECURITY;

-- Passengers can view their own scholar profile
CREATE POLICY "Passengers can view their own scholar profile"
ON public.scholar_profiles
FOR SELECT
USING (passenger_id = get_passenger_id(auth.uid()));

-- Passengers can insert their own scholar profile
CREATE POLICY "Passengers can insert their own scholar profile"
ON public.scholar_profiles
FOR INSERT
WITH CHECK (passenger_id = get_passenger_id(auth.uid()));

-- Passengers can update their own scholar profile
CREATE POLICY "Passengers can update their own scholar profile"
ON public.scholar_profiles
FOR UPDATE
USING (passenger_id = get_passenger_id(auth.uid()));

-- Drivers can view scholar profiles for their trips (for guardian contact)
CREATE POLICY "Drivers can view scholar profiles for their trips"
ON public.scholar_profiles
FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM trips t
  JOIN trip_passengers tp ON tp.trip_id = t.id
  WHERE tp.passenger_id = scholar_profiles.passenger_id
    AND t.driver_id = get_driver_id(auth.uid())
    AND t.status IN ('driver_assigned', 'in_progress')
));

-- Create trigger for updated_at on scholar_profiles
CREATE TRIGGER update_scholar_profiles_updated_at
BEFORE UPDATE ON public.scholar_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();