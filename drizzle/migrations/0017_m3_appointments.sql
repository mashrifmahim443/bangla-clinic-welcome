ALTER TABLE public.doctors ADD COLUMN bio_bn text, ADD COLUMN bio_en text;
ALTER TABLE public.appointments ADD COLUMN consultation_type text NOT NULL DEFAULT 'video', ADD COLUMN reason text NOT NULL DEFAULT '', ADD COLUMN duration_minutes integer NOT NULL DEFAULT 30, ADD COLUMN cancellation_reason text, ADD COLUMN refund_decision text, ADD COLUMN refund_note text, ADD COLUMN cancelled_at timestamptz;
UPDATE public.appointments SET status='confirmed' WHERE status='booked';
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.appointments ADD CONSTRAINT appointment_status_valid CHECK(status IN ('pending','confirmed','completed','cancelled','no_show')), ADD CONSTRAINT consultation_type_valid CHECK(consultation_type IN ('video','audio','chat'));
ALTER TABLE public.appointments DROP CONSTRAINT appointments_doctor_id_slot_start_key;
CREATE UNIQUE INDEX appointments_active_slot_unique ON public.appointments(doctor_id,slot_start) WHERE status IN ('pending','confirmed');
CREATE TABLE public.doctor_schedule(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE, weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6), start_time time NOT NULL, end_time time NOT NULL, slot_minutes integer NOT NULL DEFAULT 30 CHECK(slot_minutes IN (15,30,45,60)), CHECK(end_time>start_time), UNIQUE(doctor_id,weekday));
GRANT SELECT ON public.doctor_schedule TO anon,authenticated; GRANT ALL ON public.doctor_schedule TO service_role; GRANT INSERT,UPDATE,DELETE ON public.doctor_schedule TO authenticated;
ALTER TABLE public.doctor_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedule_read ON public.doctor_schedule FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY schedule_manage ON public.doctor_schedule FOR ALL TO authenticated USING(doctor_id=public.my_doctor_id()) WITH CHECK(doctor_id=public.my_doctor_id());
CREATE TABLE public.doctor_leave(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE, leave_date date NOT NULL, UNIQUE(doctor_id,leave_date));
GRANT SELECT ON public.doctor_leave TO anon,authenticated; GRANT INSERT,DELETE ON public.doctor_leave TO authenticated; GRANT ALL ON public.doctor_leave TO service_role;
ALTER TABLE public.doctor_leave ENABLE ROW LEVEL SECURITY;
CREATE POLICY leave_read ON public.doctor_leave FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY leave_manage ON public.doctor_leave FOR ALL TO authenticated USING(doctor_id=public.my_doctor_id()) WITH CHECK(doctor_id=public.my_doctor_id());
CREATE TABLE public.appointment_reports(appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE, report_id uuid NOT NULL REFERENCES public.old_prescriptions(id) ON DELETE CASCADE, PRIMARY KEY(appointment_id,report_id));
GRANT SELECT ON public.appointment_reports TO authenticated; GRANT ALL ON public.appointment_reports TO service_role;
ALTER TABLE public.appointment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_participants ON public.appointment_reports FOR SELECT TO authenticated USING(public.is_appointment_participant(appointment_id));
CREATE TABLE public.appointment_notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE, status text NOT NULL, slot_start timestamptz NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE ON public.appointment_notifications TO authenticated; GRANT ALL ON public.appointment_notifications TO service_role;
ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_read ON public.appointment_notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY notification_update ON public.appointment_notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.doctor_reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE, doctor_id uuid NOT NULL REFERENCES public.doctors(id), patient_id uuid NOT NULL DEFAULT auth.uid(), rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), body text NOT NULL DEFAULT '' CHECK(length(body)<=1000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.doctor_reviews TO anon,authenticated; GRANT INSERT ON public.doctor_reviews TO authenticated; GRANT ALL ON public.doctor_reviews TO service_role;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_read ON public.doctor_reviews FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY review_create ON public.doctor_reviews FOR INSERT TO authenticated WITH CHECK(patient_id=auth.uid() AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND a.patient_id=auth.uid() AND a.doctor_id=doctor_reviews.doctor_id AND a.status='completed'));
CREATE OR REPLACE FUNCTION public.available_doctor_slots(_doctor uuid,_from date,_to date) RETURNS TABLE(slot_start timestamptz,duration_minutes integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT s.ts, w.slot_minutes FROM generate_series(_from::timestamp,LEAST(_to,_from+60)::timestamp,'1 day') d
JOIN public.doctor_schedule w ON w.doctor_id=_doctor AND w.weekday=extract(dow FROM d)::integer
CROSS JOIN LATERAL generate_series((d::date+w.start_time) AT TIME ZONE 'Asia/Dhaka', (d::date+w.end_time) AT TIME ZONE 'Asia/Dhaka'-make_interval(mins=>w.slot_minutes),make_interval(mins=>w.slot_minutes)) s(ts)
WHERE s.ts>now() AND EXISTS(SELECT 1 FROM public.doctors WHERE id=_doctor AND active)
AND NOT EXISTS(SELECT 1 FROM public.doctor_leave l WHERE l.doctor_id=_doctor AND l.leave_date=d::date)
AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.doctor_id=_doctor AND a.status IN ('pending','confirmed') AND tstzrange(a.slot_start,a.slot_start+make_interval(mins=>a.duration_minutes),'[)') && tstzrange(s.ts,s.ts+make_interval(mins=>w.slot_minutes),'[)')) ORDER BY s.ts $$;
REVOKE ALL ON FUNCTION public.available_doctor_slots(uuid,date,date) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.available_doctor_slots(uuid,date,date) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.booked_slots(_doctor uuid,_from timestamptz,_to timestamptz) RETURNS SETOF timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT slot_start FROM public.appointments WHERE doctor_id=_doctor AND status IN ('pending','confirmed') AND slot_start BETWEEN _from AND LEAST(_to,_from+interval '61 days') $$;
REVOKE INSERT,UPDATE ON public.appointments FROM authenticated;
CREATE OR REPLACE FUNCTION public.book_appointment(_doctor uuid,_slot timestamptz,_type text,_reason text,_reports uuid[] DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid; mins integer;
BEGIN
IF auth.uid() IS NULL OR NOT public.is_active_user(auth.uid()) OR coalesce(public.profile_completion(auth.uid()),0)<60 THEN RAISE EXCEPTION 'Active account and 60%% complete profile required'; END IF;
IF _type NOT IN ('video','audio','chat') OR length(trim(_reason))<3 OR length(_reason)>2000 THEN RAISE EXCEPTION 'Choose consultation type and enter a reason (3–2000 characters)'; END IF;
PERFORM 1 FROM public.doctors WHERE id=_doctor AND active FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Doctor unavailable'; END IF;
SELECT duration_minutes INTO mins FROM public.available_doctor_slots(_doctor,(_slot AT TIME ZONE 'Asia/Dhaka')::date,(_slot AT TIME ZONE 'Asia/Dhaka')::date) WHERE slot_start=_slot;
IF mins IS NULL THEN RAISE EXCEPTION 'This slot is unavailable'; END IF;
IF EXISTS(SELECT 1 FROM unnest(_reports) r WHERE NOT EXISTS(SELECT 1 FROM public.old_prescriptions p WHERE p.id=r AND p.user_id=auth.uid())) THEN RAISE EXCEPTION 'Only your own reports can be attached'; END IF;
INSERT INTO public.appointments(doctor_id,patient_id,slot_start,status,consultation_type,reason,duration_minutes) VALUES(_doctor,auth.uid(),_slot,'pending',_type,trim(_reason),mins) RETURNING id INTO result;
INSERT INTO public.appointment_reports SELECT result,r FROM unnest(_reports) r ON CONFLICT DO NOTHING;
RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.book_appointment(uuid,timestamptz,text,text,uuid[]) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.book_appointment(uuid,timestamptz,text,text,uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.change_appointment(_id uuid,_status text,_slot timestamptz DEFAULT NULL,_reason text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.appointments; doc boolean; adm boolean; mins integer;
BEGIN
SELECT * INTO a FROM public.appointments WHERE id=_id; IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found'; END IF;
PERFORM 1 FROM public.doctors WHERE id=a.doctor_id FOR UPDATE;
SELECT * INTO a FROM public.appointments WHERE id=_id FOR UPDATE;
adm:=public.has_role(auth.uid(),'admin'); doc:=a.doctor_id=public.my_doctor_id();
IF auth.uid() IS NULL OR NOT (coalesce(adm,false) OR coalesce(doc,false) OR a.patient_id=auth.uid()) THEN RAISE EXCEPTION 'Not permitted'; END IF;
IF a.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'This appointment is already closed'; END IF;
IF NOT coalesce(doc,false) AND NOT coalesce(adm,false) AND (_status<>'cancelled' OR _slot IS NOT NULL) THEN RAISE EXCEPTION 'Patients may only cancel'; END IF;
IF _status NOT IN ('confirmed','completed','cancelled','no_show') THEN RAISE EXCEPTION 'Invalid status'; END IF;
IF _status IN ('completed','no_show') AND (a.status<>'confirmed' OR a.slot_start>now()) THEN RAISE EXCEPTION 'Only a confirmed consultation that has started can be closed'; END IF;
IF _status='confirmed' AND _slot IS NULL AND a.status<>'pending' THEN RAISE EXCEPTION 'Already confirmed'; END IF;
IF _slot IS NOT NULL THEN
IF _status<>'confirmed' THEN RAISE EXCEPTION 'Rescheduling requires confirmed status'; END IF;
SELECT duration_minutes INTO mins FROM public.available_doctor_slots(a.doctor_id,(_slot AT TIME ZONE 'Asia/Dhaka')::date,(_slot AT TIME ZONE 'Asia/Dhaka')::date) WHERE slot_start=_slot;
IF mins IS NULL THEN RAISE EXCEPTION 'This slot is unavailable'; END IF;
END IF;
IF _status='cancelled' AND length(trim(_reason))<3 THEN RAISE EXCEPTION 'Enter a cancellation reason'; END IF;
UPDATE public.appointments SET status=_status,slot_start=coalesce(_slot,slot_start),duration_minutes=coalesce(mins,duration_minutes),cancellation_reason=CASE WHEN _status='cancelled' THEN left(_reason,2000) ELSE cancellation_reason END,cancelled_at=CASE WHEN _status='cancelled' THEN now() ELSE cancelled_at END,refund_decision=CASE WHEN _status='cancelled' THEN CASE WHEN a.slot_start-now()>=interval '24 hours' THEN 'eligible' ELSE 'admin_review' END ELSE refund_decision END WHERE id=_id;
END $$;
REVOKE ALL ON FUNCTION public.change_appointment(uuid,text,timestamptz,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.change_appointment(uuid,text,timestamptz,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.review_appointment_refund(_id uuid,_approve boolean,_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
IF length(trim(_note))<3 THEN RAISE EXCEPTION 'Enter a decision reason'; END IF;
UPDATE public.appointments SET refund_decision=CASE WHEN _approve THEN 'approved' ELSE 'declined' END,refund_note=left(_note,2000) WHERE id=_id AND status='cancelled' AND refund_decision='admin_review';
IF NOT FOUND THEN RAISE EXCEPTION 'No pending refund decision'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_appointment_refund(uuid,boolean,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.review_appointment_refund(uuid,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_doctor_presence(_status public.doctor_status,_bio_bn text DEFAULT NULL,_bio_en text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
UPDATE public.doctors SET status=_status,bio_bn=coalesce(_bio_bn,bio_bn),bio_en=coalesce(_bio_en,bio_en) WHERE id=public.my_doctor_id() AND active;
IF NOT FOUND THEN RAISE EXCEPTION 'Approved active doctor required'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_doctor_presence(public.doctor_status,text,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.set_doctor_presence(public.doctor_status,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.notify_appointment_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR NEW.slot_start IS DISTINCT FROM OLD.slot_start OR NEW.refund_decision IS DISTINCT FROM OLD.refund_decision THEN
INSERT INTO public.appointment_notifications(user_id,appointment_id,status,slot_start) VALUES(NEW.patient_id,NEW.id,CASE WHEN TG_OP='UPDATE' AND NEW.refund_decision IS DISTINCT FROM OLD.refund_decision AND NEW.status=OLD.status THEN coalesce(NEW.refund_decision,NEW.status) ELSE NEW.status END,NEW.slot_start);
INSERT INTO public.appointment_notifications(user_id,appointment_id,status,slot_start) SELECT user_id,NEW.id,NEW.status,NEW.slot_start FROM public.doctors WHERE id=NEW.doctor_id AND user_id IS NOT NULL AND user_id<>NEW.patient_id;
END IF; RETURN NEW; END $$;
CREATE TRIGGER appointment_notifications_trigger AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();
REVOKE UPDATE ON public.appointment_notifications FROM authenticated; GRANT UPDATE(read_at) ON public.appointment_notifications TO authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='doctors') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors; END IF; IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointments') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; END IF; IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointment_notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_notifications; END IF; END $$;