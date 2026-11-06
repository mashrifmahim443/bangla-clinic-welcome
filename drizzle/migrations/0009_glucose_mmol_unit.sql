-- Sugar unit: mg/dL -> mmol/L (mmol/L = mg/dL / 18.016)
alter table public.glucose_readings add column value_mmol double precision;
alter table public.glucose_readings add constraint value_mmol_range check (value_mmol is null or value_mmol between 1.1 and 33.3);
update public.glucose_readings set value_mmol = round((value_mgdl / 18.016)::numeric, 1) where value_mmol is null and value_mgdl is not null;
alter table public.glucose_readings drop constraint value_range;
alter table public.glucose_readings alter column value_mgdl drop not null;
comment on column public.glucose_readings.value_mgdl is 'DEPRECATED: replaced by value_mmol (mmol/L)';

drop function public.submit_checkin(text, boolean, boolean, integer);
drop function public.submit_checkin(text, boolean, boolean, integer, text);

create or replace function public.submit_checkin(_token text, _ate boolean, _took_medicine boolean, _value double precision, _food text default null)
returns boolean language plpgsql security definer set search_path = public
as $$ declare l public.checkin_links;
begin
  select * into l from public.checkin_links where token = _token and expires_at > now() and used_at is null for update;
  if not found then return false; end if;
  if _value is not null and (_value < 1.1 or _value > 33.3) then raise exception 'value out of range'; end if;
  if _food is not null and char_length(_food) > 300 then raise exception 'food too long'; end if;
  update public.checkin_links set used_at = now(), ate = _ate, took_medicine = _took_medicine, food = nullif(trim(_food),'') where token = _token;
  if _value is not null then
    insert into public.glucose_readings (user_id, value_mmol, reading_type, note)
    values (l.user_id, round(_value::numeric, 1), case when _ate then 'after_meal'::public.reading_type else 'before_meal'::public.reading_type end,
      left(coalesce(nullif(trim(_food),''), 'SMS check-in'), 200));
  end if;
  return true;
end $$;
grant execute on function public.submit_checkin(text, boolean, boolean, double precision, text) to anon, authenticated;