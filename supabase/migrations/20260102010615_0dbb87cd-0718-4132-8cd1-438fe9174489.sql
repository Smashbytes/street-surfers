-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'passenger');

-- Create enum for trip types
CREATE TYPE public.trip_type AS ENUM ('inbound', 'outbound');

-- Create enum for trip status
CREATE TYPE public.trip_status AS ENUM ('scheduled', 'driver_assigned', 'in_progress', 'completed', 'cancelled');

-- Create enum for passenger trip status
CREATE TYPE public.passenger_trip_status AS ENUM ('confirmed', 'picked_up', 'dropped_off', 'no_show', 'cancelled');

-- Create enum for status log types
CREATE TYPE public.status_log_type AS ENUM ('trip_status', 'passenger_status', 'driver_location', 'sos_alert', 'notification');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create passengers table
CREATE TABLE public.passengers (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_plate TEXT,
  vehicle_photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_type trip_type NOT NULL,
  scheduled_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_time_window_minutes INTEGER DEFAULT 15,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  status trip_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_passengers junction table
CREATE TABLE public.trip_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES public.passengers(id) ON DELETE CASCADE NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  seat_number INTEGER,
  status passenger_trip_status NOT NULL DEFAULT 'confirmed',
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, passenger_id)
);

-- Create driver_locations table for live tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create status_logs table for events and SOS
CREATE TABLE public.status_logs (
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

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user's passenger ID
CREATE OR REPLACE FUNCTION public.get_passenger_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.passengers WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get current user's driver ID
CREATE OR REPLACE FUNCTION public.get_driver_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.drivers WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User Roles RLS Policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Passengers RLS Policies
CREATE POLICY "Passengers can view their own record"
ON public.passengers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Passengers can update their own record"
ON public.passengers FOR UPDATE
USING (auth.uid() = user_id);

-- Drivers RLS Policies
CREATE POLICY "Drivers can view their own record"
ON public.drivers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own record"
ON public.drivers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Passengers can view driver info for their trips"
ON public.drivers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.trip_passengers tp ON tp.trip_id = t.id
    WHERE t.driver_id = drivers.id
    AND tp.passenger_id = public.get_passenger_id(auth.uid())
  )
);

-- Trips RLS Policies
CREATE POLICY "Passengers can view their assigned trips"
ON public.trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_passengers tp
    WHERE tp.trip_id = trips.id
    AND tp.passenger_id = public.get_passenger_id(auth.uid())
  )
);

CREATE POLICY "Drivers can view their assigned trips"
ON public.trips FOR SELECT
USING (driver_id = public.get_driver_id(auth.uid()));

CREATE POLICY "Drivers can update their assigned trips"
ON public.trips FOR UPDATE
USING (driver_id = public.get_driver_id(auth.uid()));

-- Trip Passengers RLS Policies
CREATE POLICY "Passengers can view their trip assignments"
ON public.trip_passengers FOR SELECT
USING (passenger_id = public.get_passenger_id(auth.uid()));

CREATE POLICY "Passengers can update their own trip status"
ON public.trip_passengers FOR UPDATE
USING (passenger_id = public.get_passenger_id(auth.uid()));

-- Driver Locations RLS Policies
CREATE POLICY "Passengers can view driver location for their active trips"
ON public.driver_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.trip_passengers tp ON tp.trip_id = t.id
    WHERE t.driver_id = driver_locations.driver_id
    AND tp.passenger_id = public.get_passenger_id(auth.uid())
    AND t.status IN ('driver_assigned', 'in_progress')
  )
);

CREATE POLICY "Drivers can insert their own location"
ON public.driver_locations FOR INSERT
WITH CHECK (driver_id = public.get_driver_id(auth.uid()));

CREATE POLICY "Drivers can view their own locations"
ON public.driver_locations FOR SELECT
USING (driver_id = public.get_driver_id(auth.uid()));

-- Status Logs RLS Policies
CREATE POLICY "Users can view their own status logs"
ON public.status_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status logs"
ON public.status_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Enable realtime for trips
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;

-- Enable realtime for trip_passengers
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_passengers;

-- Enable realtime for status_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.status_logs;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passengers_updated_at
  BEFORE UPDATE ON public.passengers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_passengers_updated_at
  BEFORE UPDATE ON public.trip_passengers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup - creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_trips_scheduled_date ON public.trips(scheduled_date);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trip_passengers_trip_id ON public.trip_passengers(trip_id);
CREATE INDEX idx_trip_passengers_passenger_id ON public.trip_passengers(passenger_id);
CREATE INDEX idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_recorded_at ON public.driver_locations(recorded_at DESC);
CREATE INDEX idx_status_logs_user_id ON public.status_logs(user_id);
CREATE INDEX idx_status_logs_log_type ON public.status_logs(log_type);
CREATE INDEX idx_status_logs_created_at ON public.status_logs(created_at DESC);