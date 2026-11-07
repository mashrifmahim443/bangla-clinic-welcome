CREATE OR REPLACE FUNCTION public.approve_admin_assigned_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    UPDATE public.profiles SET account_status = 'active' WHERE id = NEW.user_id;
    IF NEW.role = 'doctor' THEN
      UPDATE public.doctors SET active = true WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_admin_assigned_role() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER approve_admin_assigned_role AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.approve_admin_assigned_role();

CREATE OR REPLACE FUNCTION public.activate_role_holder_doctor_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND public.has_role(NEW.user_id, 'doctor')
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND account_status = 'active') THEN
    NEW.active := true;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.activate_role_holder_doctor_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER activate_role_holder_doctor_profile BEFORE INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.activate_role_holder_doctor_profile();