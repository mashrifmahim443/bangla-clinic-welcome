create type public.reading_type as enum ('fasting','before_meal','after_meal','bedtime','random');
create table public.glucose_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  value_mgdl integer not null,
  reading_type reading_type not null default 'random',
  note text,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint value_range check (value_mgdl between 20 and 600),
  constraint note_len check (note is null or char_length(note) <= 200)
);
grant select, insert, update, delete on public.glucose_readings to authenticated;
grant all on public.glucose_readings to service_role;
alter table public.glucose_readings enable row level security;
create policy "Own readings select" on public.glucose_readings for select to authenticated using (auth.uid() = user_id);
create policy "Own readings insert" on public.glucose_readings for insert to authenticated with check (auth.uid() = user_id);
create policy "Own readings update" on public.glucose_readings for update to authenticated using (auth.uid() = user_id);
create policy "Own readings delete" on public.glucose_readings for delete to authenticated using (auth.uid() = user_id);
create index on public.glucose_readings (user_id, taken_at desc);