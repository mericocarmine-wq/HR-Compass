-- Active membership is the tenant boundary. Pending invitations must not grant data access.
create or replace function public.get_user_company_ids(_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.company_members
  where user_id = _user_id
    and status = 'active';
$$;

revoke all on function public.get_user_company_ids(uuid) from public;
grant execute on function public.get_user_company_ids(uuid) to authenticated;

drop policy if exists "Owner/admin can invite members" on public.company_members;

-- Direct inserts are only used atomically while creating the first owner membership.
create policy "Creator can create owner membership"
  on public.company_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and status = 'active'
    and exists (
      select 1 from public.companies company
      where company.id = company_id and company.created_by = auth.uid()
    )
  );

alter table public.company_members
  add constraint company_members_role_check
  check (role in ('owner', 'admin', 'manager', 'empleado')) not valid;

alter table public.company_members
  add constraint company_members_status_check
  check (status in ('pending', 'active', 'inactive')) not valid;

create unique index if not exists company_members_company_email_unique
  on public.company_members (company_id, lower(email));
