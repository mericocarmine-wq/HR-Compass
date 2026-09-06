
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_members WHERE user_id = _user_id;
$$;

DROP POLICY "Members can view their company" ON public.companies;
CREATE POLICY "Members can view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY "Members can view their company members" ON public.company_members;
CREATE POLICY "Members can view their company members"
  ON public.company_members FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY "Owner/admin can invite members" ON public.company_members;
CREATE POLICY "Owner/admin can invite members"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND role = 'owner')
    OR
    (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  );
