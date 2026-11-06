create type public.checkin_slot as enum ('morning','lunch','dinner');
create table public.checkin_links (
  token text primary key default encode(gen_random_bytes(12),'hex'),
  user_id uuid not null default auth.uid(),
  slot public.checkin_slot not null,
  expires_at timestamptz not null default now() + interval '12 hours',
  used_at timestamptz,
  ate boolean, took_medicine boolean,
  created_at timestamptz not null default now()
);
grant select, insert on public.checkin_links to authenticated;
grant all on public.checkin_links to service_role;
alter table public.checkin_links enable row level security;
create policy "Own links read" on public.checkin_links for select to authenticated using (user_id = auth.uid());
create policy "Own links create" on public.checkin_links for insert to authenticated with check (user_id = auth.uid());

create or replace function public.checkin_info(_token text)
returns table(first_name text, slot public.checkin_slot, used boolean)
language sql stable security definer set search_path = public
as $$ select split_part(coalesce(p.full_name,''),' ',1), l.slot, l.used_at is not null
  from public.checkin_links l left join public.profiles p on p.id = l.user_id
  where l.token = _token and l.expires_at > now() $$;

create or replace function public.submit_checkin(_token text, _ate boolean, _took_medicine boolean, _value int)
returns boolean language plpgsql security definer set search_path = public
as $$ declare l public.checkin_links;
begin
  select * into l from public.checkin_links where token = _token and expires_at > now() and used_at is null for update;
  if not found then return false; end if;
  if _value is not null and (_value < 20 or _value > 600) then raise exception 'value out of range'; end if;
  update public.checkin_links set used_at = now(), ate = _ate, took_medicine = _took_medicine where token = _token;
  if _value is not null then
    insert into public.glucose_readings (user_id, value_mgdl, reading_type, note)
    values (l.user_id, _value, case when _ate then 'after_meal'::public.reading_type else 'before_meal'::public.reading_type end, 'SMS check-in');
  end if;
  return true;
end $$;
grant execute on function public.checkin_info(text) to anon, authenticated;
grant execute on function public.submit_checkin(text, boolean, boolean, int) to anon, authenticated;