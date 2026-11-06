create type public.doctor_status as enum ('online','busy','offline');
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_bn text not null,
  name_en text not null,
  degrees text not null,
  specialty text not null,
  bmdc_no text not null,
  fee_bdt integer not null,
  status doctor_status not null default 'offline',
  gender text not null default 'female',
  languages text[] not null default '{bn}',
  created_at timestamptz not null default now()
);
grant select on public.doctors to anon, authenticated;
grant all on public.doctors to service_role;
alter table public.doctors enable row level security;
create policy "Doctors are public" on public.doctors for select to anon, authenticated using (true);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null default auth.uid(),
  slot_start timestamptz not null,
  status text not null default 'booked',
  created_at timestamptz not null default now(),
  unique (doctor_id, slot_start)
);
grant select, insert, update on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "Patients see own appointments" on public.appointments for select to authenticated using (auth.uid() = patient_id);
create policy "Patients book for themselves" on public.appointments for insert to authenticated with check (auth.uid() = patient_id and slot_start > now());
create policy "Patients cancel own" on public.appointments for update to authenticated using (auth.uid() = patient_id);

create or replace function public.booked_slots(_doctor uuid, _from timestamptz, _to timestamptz)
returns setof timestamptz language sql stable security definer set search_path = public
as $$ select slot_start from public.appointments where doctor_id = _doctor and status = 'booked' and slot_start between _from and _to $$;
grant execute on function public.booked_slots(uuid, timestamptz, timestamptz) to anon, authenticated;

insert into public.doctors (slug, name_bn, name_en, degrees, specialty, bmdc_no, fee_bdt, status, gender, languages) values
('nasrin-islam','ডা. নাসরিন ইসলাম','Dr. Nasrin Islam','MBBS, FCPS (Medicine), MD (Endocrinology)','endocrinology','A-41235',800,'online','female','{bn,en}'),
('rafiqul-hasan','ডা. রফিকুল হাসান','Dr. Rafiqul Hasan','MBBS, CCD (BIRDEM)','diabetology','A-38817',600,'busy','male','{bn}'),
('farhana-chowdhury','ডা. ফারহানা চৌধুরী','Dr. Farhana Chowdhury','MBBS, MSc (Nutrition)','nutrition','A-52240',500,'offline','female','{bn,en}'),
('mahmud-karim','ডা. মাহমুদ করিম','Dr. Mahmud Karim','MBBS, FCPS (Medicine)','medicine','A-29904',700,'online','male','{bn,en}'),
('shirin-akter','ডা. শিরিন আক্তার','Dr. Shirin Akter','MBBS, DEM, MACE (USA)','endocrinology','A-47712',1000,'offline','female','{bn,en}'),
('anwar-hossain','ডা. আনোয়ার হোসেন','Dr. Anwar Hossain','MBBS, CCD, DCH','diabetology','A-35561',500,'online','male','{bn}');