
DROP POLICY "Authenticated can insert company" ON public.companies;
DROP POLICY "Members can view their company" ON public.companies;

CREATE POLICY "Authenticated can create company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator or member can view company"
  ON public.companies FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT public.get_user_company_ids(auth.uid()))
  );
