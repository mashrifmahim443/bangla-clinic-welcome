alter table public.checkin_links add column food text;
alter table public.checkin_links add constraint food_len check (food is null or char_length(food) <= 300);

create type public.diabetes_type as enum ('type1','type2','gestational','prediabetes','unsure');
alter table public.profiles add column diabetes_type public.diabetes_type, add column birth_year int, add column gender text;
alter table public.profiles add constraint birth_year_range check (birth_year is null or birth_year between 1920 and 2015);
alter table public.profiles add constraint gender_val check (gender is null or gender in ('m','f'));

create or replace function public.submit_checkin(_token text, _ate boolean, _took_medicine boolean, _value int, _food text default null)
returns boolean language plpgsql security definer set search_path = public
as $$ declare l public.checkin_links;
begin
  select * into l from public.checkin_links where token = _token and expires_at > now() and used_at is null for update;
  if not found then return false; end if;
  if _value is not null and (_value < 20 or _value > 600) then raise exception 'value out of range'; end if;
  if _food is not null and char_length(_food) > 300 then raise exception 'food too long'; end if;
  update public.checkin_links set used_at = now(), ate = _ate, took_medicine = _took_medicine, food = nullif(trim(_food),'') where token = _token;
  if _value is not null then
    insert into public.glucose_readings (user_id, value_mgdl, reading_type, note)
    values (l.user_id, _value, case when _ate then 'after_meal'::public.reading_type else 'before_meal'::public.reading_type end,
      left(coalesce(nullif(trim(_food),''), 'SMS check-in'), 200));
  end if;
  return true;
end $$;
grant execute on function public.submit_checkin(text, boolean, boolean, int, text) to anon, authenticated;
create policy "Admins read checkins" on public.checkin_links for select to authenticated using (public.has_role(auth.uid(),'admin'));

create type public.application_status as enum ('pending','approved','rejected');
create table public.doctor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name_bn text not null, name_en text not null, degrees text not null,
  specialty text not null, bmdc_no text not null, fee_bdt int not null,
  gender text, phone text,
  status public.application_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  constraint fee_range check (fee_bdt between 100 and 10000),
  constraint spec_val check (specialty in ('endocrinology','diabetology','nutrition','medicine')),
  constraint bmdc_fmt check (bmdc_no ~ '^[A-Za-z]?-?[0-9]{3,7}$')
);
create unique index on public.doctor_applications (user_id) where status = 'pending';
grant select, insert on public.doctor_applications to authenticated;
grant all on public.doctor_applications to service_role;
alter table public.doctor_applications enable row level security;
create policy "Own applications read" on public.doctor_applications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Own applications create" on public.doctor_applications for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

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
      a.name_bn, a.name_en, a.degrees, a.specialty, a.bmdc_no, a.fee_bdt, 'offline', a.gender, a.user_id);
    insert into public.user_roles (user_id, role) values (a.user_id, 'doctor') on conflict do nothing;
  end if;
end $$;
revoke execute on function public.review_doctor_application(uuid, boolean, text) from anon, public;
grant execute on function public.review_doctor_application(uuid, boolean, text) to authenticated;