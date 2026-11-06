create or replace function public.review_doctor_application(_id uuid, _approve boolean, _note text default null)
returns void language plpgsql security definer set search_path = public
as $$ declare a public.doctor_applications;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select * into a from public.doctor_applications where id = _id and status = 'pending' for update;
  if not found then raise exception 'not pending'; end if;
  update public.doctor_applications set status = case when _approve then 'approved'::public.application_status else 'rejected'::public.application_status end, admin_note = _note where id = _id;
  if _approve then
    insert into public.doctors (slug, name_bn, name_en, degrees, specialty, bmdc_no, fee_bdt, status, gender, user_id)
    values (lower(regexp_replace(a.name_en, '[^A-Za-z0-9]+', '-', 'g')) || '-' || substr(a.id::text,1,4),
      a.name_bn, a.name_en, a.degrees, a.specialty, a.bmdc_no, a.fee_bdt, 'offline', coalesce(a.gender, 'female'), a.user_id);
    insert into public.user_roles (user_id, role) values (a.user_id, 'doctor') on conflict do nothing;
  end if;
end $$;