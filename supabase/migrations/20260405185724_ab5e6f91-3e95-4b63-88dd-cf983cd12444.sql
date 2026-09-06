
DROP POLICY "Authenticated can insert members" ON public.company_members;
DROP POLICY "Auto-create profile" ON public.profiles;

CREATE POLICY "Owner/admin can invite members"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND role = 'owner')
    OR
    (company_id IN (
      SELECT cm.company_id FROM public.company_members cm 
      WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Profile auto-create"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());
