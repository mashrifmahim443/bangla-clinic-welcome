alter table public.doctors add column user_id uuid unique;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new; end $$;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.handle_new_user_profile();
insert into public.profiles (id, full_name, phone)
  select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone' from auth.users on conflict do nothing;

create or replace function public.my_doctor_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.doctors where user_id = auth.uid() $$;

create or replace function public.is_appointment_participant(_appt uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.appointments a join public.doctors d on d.id = a.doctor_id
  where a.id = _appt and (a.patient_id = auth.uid() or d.user_id = auth.uid())) $$;

create or replace function public.is_doctor_of_patient(_patient uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.appointments a join public.doctors d on d.id = a.doctor_id
  where a.patient_id = _patient and d.user_id = auth.uid()) $$;

create policy "Own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.is_doctor_of_patient(id));
create policy "Own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Doctors see their appointments" on public.appointments for select to authenticated using (doctor_id = public.my_doctor_id());
create policy "Doctors update their appointments" on public.appointments for update to authenticated using (doctor_id = public.my_doctor_id());
create policy "Doctors read their patients readings" on public.glucose_readings for select to authenticated using (public.is_doctor_of_patient(user_id));

create table public.consult_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sender_id uuid not null default auth.uid(),
  body text not null,
  created_at timestamptz not null default now(),
  constraint body_len check (char_length(body) between 1 and 2000)
);
grant select, insert on public.consult_messages to authenticated;
grant all on public.consult_messages to service_role;
alter table public.consult_messages enable row level security;
create policy "Participants read messages" on public.consult_messages for select to authenticated using (public.is_appointment_participant(appointment_id));
create policy "Participants send messages" on public.consult_messages for insert to authenticated with check (sender_id = auth.uid() and public.is_appointment_participant(appointment_id));
create index on public.consult_messages (appointment_id, created_at);
alter publication supabase_realtime add table public.consult_messages;

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  patient_id uuid not null,
  doctor_id uuid not null references public.doctors(id),
  chief_complaints text,
  items jsonb not null default '[]',
  advice text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.prescriptions to authenticated;
grant all on public.prescriptions to service_role;
alter table public.prescriptions enable row level security;
create policy "Patient reads own prescriptions" on public.prescriptions for select to authenticated using (patient_id = auth.uid());
create policy "Doctor reads own prescriptions" on public.prescriptions for select to authenticated using (doctor_id = public.my_doctor_id() or public.is_doctor_of_patient(patient_id));
create policy "Doctor writes prescription" on public.prescriptions for insert to authenticated with check (doctor_id = public.my_doctor_id() and public.is_appointment_participant(appointment_id));
create policy "Doctor updates prescription" on public.prescriptions for update to authenticated using (doctor_id = public.my_doctor_id());