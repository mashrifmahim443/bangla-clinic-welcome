ALTER TABLE public.doctor_applications
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS workplace text,
  ADD COLUMN IF NOT EXISTS experience_years integer;

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS workplace text,
  ADD COLUMN IF NOT EXISTS experience_years integer;

CREATE TABLE public.doctor_contacts (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  address text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.doctor_contacts TO authenticated;
GRANT ALL ON public.doctor_contacts TO service_role;
ALTER TABLE public.doctor_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own contact read" ON public.doctor_contacts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own contact update" ON public.doctor_contacts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_my_doctor_profile(_degrees text, _designation text, _workplace text, _experience integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(trim(_degrees),'') = '' OR coalesce(trim(_designation),'') = '' OR coalesce(trim(_workplace),'') = '' THEN RAISE EXCEPTION 'missing fields'; END IF;
  UPDATE public.doctors SET degrees = trim(_degrees), designation = trim(_designation), workplace = trim(_workplace), experience_years = _experience WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'not a doctor'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.review_doctor_application(_id uuid, _approve boolean, _note text default null)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.doctor_applications;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO a FROM public.doctor_applications WHERE id = _id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not pending'; END IF;
  UPDATE public.doctor_applications SET status = CASE WHEN _approve THEN 'approved'::public.application_status ELSE 'rejected'::public.application_status END, admin_note = _note WHERE id = _id;
  IF _approve THEN
    INSERT INTO public.doctors (slug, name_bn, name_en, degrees, specialty, bmdc_no, fee_bdt, status, gender, user_id, designation, workplace, experience_years)
    VALUES (lower(regexp_replace(a.name_en, '[^A-Za-z0-9]+', '-', 'g')) || '-' || substr(a.id::text,1,4),
      a.name_bn, a.name_en, a.degrees, a.specialty, a.bmdc_no, a.fee_bdt, 'offline', coalesce(a.gender, 'female'), a.user_id, a.designation, a.workplace, a.experience_years);
    INSERT INTO public.doctor_contacts (user_id, email, phone, whatsapp, address)
    VALUES (a.user_id, coalesce(a.email,''), coalesce(a.phone,''), coalesce(a.whatsapp, a.phone, ''), coalesce(a.address,''))
    ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, phone = excluded.phone, whatsapp = excluded.whatsapp, address = excluded.address;
    INSERT INTO public.user_roles (user_id, role) VALUES (a.user_id, 'doctor') ON CONFLICT DO NOTHING;
  END IF;
END $$;