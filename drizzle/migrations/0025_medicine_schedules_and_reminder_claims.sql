CREATE TABLE public.medicine_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, doctor_id uuid NOT NULL REFERENCES public.doctors(id), medicine_name text NOT NULL CHECK(length(trim(medicine_name)) BETWEEN 1 AND 120), dose text NOT NULL CHECK(length(trim(dose)) BETWEEN 1 AND 120), timing text NOT NULL DEFAULT '' CHECK(length(timing)<=300), comment text NOT NULL DEFAULT '' CHECK(length(comment)<=500), dose_times time[] NOT NULL CHECK(cardinality(dose_times) BETWEEN 1 AND 6), starts_on date NOT NULL, ends_on date NOT NULL CHECK(ends_on>=starts_on), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.medicine_schedules TO authenticated;
GRANT ALL ON public.medicine_schedules TO service_role;
ALTER TABLE public.medicine_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY medicine_schedule_read ON public.medicine_schedules FOR SELECT TO authenticated USING(patient_id=auth.uid() OR (public.has_role(auth.uid(),'doctor') AND public.is_doctor_of_patient(patient_id)));
CREATE POLICY medicine_schedule_create ON public.medicine_schedules FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'doctor') AND doctor_id=public.my_doctor_id() AND public.is_doctor_of_patient(patient_id));
CREATE POLICY medicine_schedule_update ON public.medicine_schedules FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'doctor') AND doctor_id=public.my_doctor_id() AND public.is_doctor_of_patient(patient_id)) WITH CHECK(public.has_role(auth.uid(),'doctor') AND doctor_id=public.my_doctor_id() AND public.is_doctor_of_patient(patient_id));
CREATE TABLE public.medicine_reminder_preferences(patient_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, sms_enabled boolean NOT NULL DEFAULT false);
GRANT SELECT, INSERT, UPDATE ON public.medicine_reminder_preferences TO authenticated;
GRANT ALL ON public.medicine_reminder_preferences TO service_role;
ALTER TABLE public.medicine_reminder_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY medicine_reminder_own ON public.medicine_reminder_preferences FOR ALL TO authenticated USING(patient_id=auth.uid()) WITH CHECK(patient_id=auth.uid());
CREATE TABLE public.medicine_reminder_dispatches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), schedule_id uuid NOT NULL REFERENCES public.medicine_schedules(id) ON DELETE CASCADE, dose_at timestamptz NOT NULL, claimed_at timestamptz NOT NULL DEFAULT now(), UNIQUE(schedule_id,dose_at));
GRANT ALL ON public.medicine_reminder_dispatches TO service_role;
ALTER TABLE public.medicine_reminder_dispatches ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_due_medicine_reminders() RETURNS TABLE(request_id uuid, recipient text, medicine_name text, dose text, timing text, dose_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH candidates AS (
 SELECT s.id, p.phone, s.medicine_name, s.dose, s.timing, ((d.day::date + t.dose_time) AT TIME ZONE 'Asia/Dhaka') AS dose_at
 FROM public.medicine_schedules s JOIN public.profiles p ON p.id=s.patient_id JOIN public.medicine_reminder_preferences pref ON pref.patient_id=s.patient_id AND pref.sms_enabled
 CROSS JOIN generate_series((now() AT TIME ZONE 'Asia/Dhaka')::date, (now() AT TIME ZONE 'Asia/Dhaka')::date+1, interval '1 day') d(day) CROSS JOIN unnest(s.dose_times) t(dose_time)
 WHERE s.active AND p.account_status='active' AND p.phone ~ '^(01[0-9]{9}|8801[0-9]{9})$' AND d.day::date BETWEEN s.starts_on AND s.ends_on
 AND ((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka')-interval '15 minutes' <= now()
 AND ((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka')-interval '15 minutes' > now()-interval '5 minutes'
 AND NOT EXISTS(SELECT 1 FROM public.medicine_reminder_dispatches x WHERE x.schedule_id=s.id AND x.dose_at=((d.day::date+t.dose_time) AT TIME ZONE 'Asia/Dhaka'))
 ORDER BY dose_at LIMIT 12
 ), claimed AS (INSERT INTO public.medicine_reminder_dispatches(schedule_id,dose_at) SELECT id,dose_at FROM candidates ON CONFLICT DO NOTHING RETURNING id,schedule_id,dose_at)
 SELECT c.id,p.phone,p.medicine_name,p.dose,p.timing,c.dose_at FROM claimed c JOIN candidates p ON p.id=c.schedule_id AND p.dose_at=c.dose_at;
$$;
REVOKE ALL ON FUNCTION public.claim_due_medicine_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_medicine_reminders() TO service_role;