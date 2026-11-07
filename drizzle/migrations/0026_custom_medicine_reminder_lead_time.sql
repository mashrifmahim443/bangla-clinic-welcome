ALTER TABLE public.medicine_schedules ADD COLUMN reminder_minutes integer NOT NULL DEFAULT 15 CHECK(reminder_minutes BETWEEN 1 AND 1440);
CREATE OR REPLACE FUNCTION public.claim_due_medicine_reminders() RETURNS TABLE(request_id uuid, recipient text, medicine_name text, dose text, timing text, dose_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH candidates AS (
 SELECT s.id, p.phone, s.medicine_name, s.dose, s.timing, ((d.day::date + t.dose_time) AT TIME ZONE 'Asia/Dhaka') AS dose_at
 FROM public.medicine_schedules s JOIN public.profiles p ON p.id=s.patient_id JOIN public.medicine_reminder_preferences pref ON pref.patient_id=s.patient_id AND pref.sms_enabled
 CROSS JOIN generate_series((now() AT TIME ZONE 'Asia/Dhaka')::date, (now() AT TIME ZONE 'Asia/Dhaka')::date+2, interval '1 day') d(day) CROSS JOIN unnest(s.dose_times) t(dose_time)
 WHERE s.active AND p.account_status='active' AND p.phone ~ '^(01[0-9]{9}|8801[0-9]{9})$' AND d.day::date BETWEEN s.starts_on AND s.ends_on
 AND ((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka')-make_interval(mins=>s.reminder_minutes) <= now()
 AND ((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka')-make_interval(mins=>s.reminder_minutes) > now()-interval '5 minutes'
 AND ((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka') > now()
 AND NOT EXISTS(SELECT 1 FROM public.medicine_reminder_dispatches x WHERE x.schedule_id=s.id AND x.dose_at=((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka'))
 ORDER BY dose_at LIMIT 12
 ), claimed AS (INSERT INTO public.medicine_reminder_dispatches(schedule_id,dose_at) SELECT id,dose_at FROM candidates ON CONFLICT DO NOTHING RETURNING id,schedule_id,dose_at)
 SELECT c.id,p.phone,p.medicine_name,p.dose,p.timing,c.dose_at FROM claimed c JOIN candidates p ON p.id=c.schedule_id AND p.dose_at=c.dose_at;
$$;
REVOKE ALL ON FUNCTION public.claim_due_medicine_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_medicine_reminders() TO service_role;