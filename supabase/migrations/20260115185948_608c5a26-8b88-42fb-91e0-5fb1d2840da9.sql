-- Create branches table for company locations
CREATE TABLE public.branches (
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

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active branches
CREATE POLICY "Authenticated users can view active branches"
  ON public.branches
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Add verification_status to companies for pending_verification flow
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'verified';

-- Update passengers table to reference branch instead of company directly for work location
ALTER TABLE public.passengers
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Add week_start to availability_requests for rolling weekly schedules
ALTER TABLE public.availability_requests
  ADD COLUMN IF NOT EXISTS week_start DATE;

-- Create trigger for branches updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing companies to branches (create a default branch for each)
INSERT INTO public.branches (company_id, branch_name, street, building_note, suburb, city, province, latitude, longitude, is_active)
SELECT 
  id as company_id,
  COALESCE(site_name, 'Main Branch') as branch_name,
  street,
  building_note,
  suburb,
  city,
  province,
  latitude,
  longitude,
  is_active
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.branches WHERE branches.company_id = companies.id
);