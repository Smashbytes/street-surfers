-- Allow authenticated users to insert new companies (for onboarding)
CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert new branches (for onboarding)
CREATE POLICY "Authenticated users can insert branches"
ON public.branches
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');