create or replace function public.can_manage_company(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members
    where company_id = _company_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'manager')
      and status = 'active'
  );
$$;

grant execute on function public.can_manage_company(uuid) to authenticated;

create or replace function public.invite_company_member(
  _company_id uuid,
  _email text,
  _role text,
  _department text default null
)
returns public.company_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.company_members;
  v_inserted public.company_members;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not public.can_manage_company(_company_id) then
    raise exception 'No tienes permisos para invitar empleados a esta empresa';
  end if;

  if _role not in ('empleado', 'admin', 'manager') then
    raise exception 'Rol no válido';
  end if;

  select *
  into v_existing
  from public.company_members
  where company_id = _company_id
    and lower(email) = lower(trim(_email))
  order by invited_at desc nulls last
  limit 1;

  if v_existing.id is not null then
    raise exception 'Ya existe una invitación o miembro con ese email en la empresa';
  end if;

  insert into public.company_members (company_id, email, role, department, status)
  values (_company_id, lower(trim(_email)), _role, nullif(trim(_department), ''), 'pending')
  returning * into v_inserted;

  return v_inserted;
end;
$$;

grant execute on function public.invite_company_member(uuid, text, text, text) to authenticated;

create or replace function public.set_company_member_status(
  _member_id uuid,
  _status text
)
returns public.company_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.company_members;
  v_updated public.company_members;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if _status not in ('active', 'inactive', 'pending') then
    raise exception 'Estado no válido';
  end if;

  select *
  into v_member
  from public.company_members
  where id = _member_id;

  if v_member.id is null then
    raise exception 'Miembro no encontrado';
  end if;

  if v_member.role = 'owner' then
    raise exception 'No puedes cambiar el estado del owner';
  end if;

  if not public.can_manage_company(v_member.company_id) then
    raise exception 'No tienes permisos para cambiar este estado';
  end if;

  update public.company_members
  set status = _status,
      joined_at = case
        when _status = 'active' and joined_at is null then now()
        else joined_at
      end
  where id = _member_id
  returning * into v_updated;

  return v_updated;
end;
$$;

grant execute on function public.set_company_member_status(uuid, text) to authenticated;