-- Create companies table for company/worksite addresses
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  site_name text,
  street text NOT NULL,
  building_note text,
  suburb text,
  city text,
  province text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies are viewable by all authenticated users (for dropdown selection)
CREATE POLICY "Authenticated users can view active companies"
ON public.companies
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

-- Update passengers table: add shift_type, company_id, and separate home address fields
ALTER TABLE public.passengers
ADD COLUMN IF NOT EXISTS shift_type text DEFAULT 'day' CHECK (shift_type IN ('day', 'night', 'rotational')),
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS home_house_number text,
ADD COLUMN IF NOT EXISTS home_street text,
ADD COLUMN IF NOT EXISTS home_suburb text,
ADD COLUMN IF NOT EXISTS home_city text,
ADD COLUMN IF NOT EXISTS home_province text,
ADD COLUMN IF NOT EXISTS address_confidence text DEFAULT 'street-level';

-- Create trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some example companies for ICE
INSERT INTO public.companies (company_name, site_name, street, building_note, suburb, city, province, latitude, longitude)
VALUES 
  ('ICE', 'Sandton', 'Rivonia Road', 'Main Entrance', 'Sandton', 'Johannesburg', 'Gauteng', -26.1076, 28.0567),
  ('ICE', 'Midrand', 'Waterfall Drive', 'Gate B', 'Midrand', 'Johannesburg', 'Gauteng', -25.9980, 28.1198),
  ('ICE', 'Rosebank', 'Oxford Road', 'Reception', 'Rosebank', 'Johannesburg', 'Gauteng', -26.1460, 28.0436);