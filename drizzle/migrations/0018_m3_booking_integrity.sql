CREATE OR REPLACE FUNCTION public.lock_doctor_availability() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='UPDATE' AND NEW.doctor_id<>OLD.doctor_id THEN RAISE EXCEPTION 'Doctor ownership cannot be changed'; END IF;
PERFORM 1 FROM public.doctors WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.doctor_id ELSE NEW.doctor_id END FOR UPDATE;
IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER lock_schedule BEFORE INSERT OR UPDATE OR DELETE ON public.doctor_schedule FOR EACH ROW EXECUTE FUNCTION public.lock_doctor_availability();
CREATE TRIGGER lock_leave BEFORE INSERT OR UPDATE OR DELETE ON public.doctor_leave FOR EACH ROW EXECUTE FUNCTION public.lock_doctor_availability();
CREATE OR REPLACE FUNCTION public.validate_appointment_overlap() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
PERFORM 1 FROM public.doctors WHERE id=NEW.doctor_id FOR UPDATE;
IF NEW.duration_minutes NOT IN (15,30,45,60) THEN RAISE EXCEPTION 'Invalid slot duration'; END IF;
IF NEW.status IN ('pending','confirmed') AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.id<>NEW.id AND a.doctor_id=NEW.doctor_id AND a.status IN ('pending','confirmed') AND tstzrange(a.slot_start,a.slot_start+make_interval(mins=>a.duration_minutes),'[)') && tstzrange(NEW.slot_start,NEW.slot_start+make_interval(mins=>NEW.duration_minutes),'[)')) THEN RAISE EXCEPTION 'Overlapping appointment'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER validate_appointment_overlap BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_overlap();
REVOKE SELECT,INSERT ON public.doctor_reviews FROM anon,authenticated;
GRANT SELECT(id,doctor_id,rating,body,created_at) ON public.doctor_reviews TO anon,authenticated;
GRANT INSERT(appointment_id,doctor_id,rating,body) ON public.doctor_reviews TO authenticated;
CREATE OR REPLACE FUNCTION public.my_reviewed_appointments() RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT appointment_id FROM public.doctor_reviews WHERE patient_id=auth.uid() $$;
REVOKE ALL ON FUNCTION public.my_reviewed_appointments() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.my_reviewed_appointments() TO authenticated;