create policy "Admins read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins read appointments" on public.appointments for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins read readings" on public.glucose_readings for select to authenticated using (public.has_role(auth.uid(),'admin'));
grant insert, delete on public.user_roles to authenticated;
create policy "Admins add roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins remove roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin') and user_id <> auth.uid());
grant update on public.doctors to authenticated;
create policy "Admins update doctors" on public.doctors for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_users()
returns table(id uuid, email text, full_name text, phone text, roles public.app_role[], created_at timestamptz, readings bigint)
language plpgsql stable security definer set search_path = public
as $$ begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query select u.id, u.email::text, p.full_name, p.phone,
    coalesce(array_agg(r.role) filter (where r.role is not null), '{}'), u.created_at,
    (select count(*) from public.glucose_readings g where g.user_id = u.id)
  from auth.users u left join public.profiles p on p.id = u.id left join public.user_roles r on r.user_id = u.id
  group by u.id, p.full_name, p.phone;
end $$;
revoke execute on function public.admin_users() from anon, public;
grant execute on function public.admin_users() to authenticated;