-- Add new fields to passengers table for access control and onboarding
ALTER TABLE public.passengers 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'active' CHECK (payment_status IN ('active', 'unpaid', 'pending')),
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
ADD COLUMN IF NOT EXISTS ride_type text NOT NULL DEFAULT 'dual' CHECK (ride_type IN ('inbound', 'outbound', 'dual')),
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS home_lat numeric,
ADD COLUMN IF NOT EXISTS home_lng numeric,
ADD COLUMN IF NOT EXISTS work_lat numeric,
ADD COLUMN IF NOT EXISTS work_lng numeric,
ADD COLUMN IF NOT EXISTS company text;

-- Create availability_requests table
CREATE TABLE public.availability_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  inbound_time time,
  outbound_time time,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(passenger_id, day_of_week, effective_from)
);

-- Enable RLS on availability_requests
ALTER TABLE public.availability_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for availability_requests
CREATE POLICY "Passengers can view their own availability"
ON public.availability_requests
FOR SELECT
USING (passenger_id = get_passenger_id(auth.uid()));

CREATE POLICY "Passengers can insert their own availability"
ON public.availability_requests
FOR INSERT
WITH CHECK (passenger_id = get_passenger_id(auth.uid()));

CREATE POLICY "Passengers can update their own pending availability"
ON public.availability_requests
FOR UPDATE
USING (passenger_id = get_passenger_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Passengers can delete their own pending availability"
ON public.availability_requests
FOR DELETE
USING (passenger_id = get_passenger_id(auth.uid()) AND status = 'pending');

-- Add trigger for updated_at
CREATE TRIGGER update_availability_requests_updated_at
BEFORE UPDATE ON public.availability_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();