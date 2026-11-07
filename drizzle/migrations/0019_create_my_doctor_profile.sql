CREATE OR REPLACE FUNCTION public.create_my_doctor_profile(
  _name_bn text, _name_en text, _degrees text, _specialty text, _bmdc_no text,
  _fee_bdt integer, _gender text, _designation text, _workplace text, _experience integer,
  _phone text, _whatsapp text, _email text, _address text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'doctor') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctors WHERE user_id = _uid) THEN RAISE EXCEPTION 'profile exists'; END IF;
  IF length(trim(_name_bn)) < 2 OR length(trim(_name_en)) < 2 THEN RAISE EXCEPTION 'name required'; END IF;
  IF length(trim(_degrees)) < 2 OR length(trim(_specialty)) < 2 THEN RAISE EXCEPTION 'degrees and specialty required'; END IF;
  IF length(trim(_bmdc_no)) < 3 THEN RAISE EXCEPTION 'bmdc required'; END IF;
  IF _fee_bdt IS NULL OR _fee_bdt < 0 OR _fee_bdt > 100000 THEN RAISE EXCEPTION 'fee invalid'; END IF;
  IF _gender NOT IN ('male','female','other') THEN RAISE EXCEPTION 'gender invalid'; END IF;
  IF _experience IS NULL OR _experience < 0 OR _experience > 60 THEN RAISE EXCEPTION 'experience invalid'; END IF;
  IF _phone !~ '^01[0-9]{9}$' THEN RAISE EXCEPTION 'phone invalid'; END IF;
  IF _whatsapp !~ '^01[0-9]{9}$' THEN RAISE EXCEPTION 'whatsapp invalid'; END IF;
  IF _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'email invalid'; END IF;
  IF length(trim(_address)) < 10 THEN RAISE EXCEPTION 'address required'; END IF;
  INSERT INTO public.doctors (slug, name_bn, name_en, degrees, specialty, bmdc_no, fee_bdt, status, gender, user_id, designation, workplace, experience_years, active)
  VALUES (lower(regexp_replace(trim(_name_en), '[^A-Za-z0-9]+', '-', 'g')) || '-' || substr(_uid::text, 1, 4),
    trim(_name_bn), trim(_name_en), trim(_degrees), trim(_specialty), trim(_bmdc_no), _fee_bdt, 'offline', _gender, _uid,
    nullif(trim(_designation), ''), nullif(trim(_workplace), ''), _experience, false)
  RETURNING id INTO _id;
  INSERT INTO public.doctor_contacts (user_id, email, phone, whatsapp, address)
  VALUES (_uid, trim(_email), _phone, _whatsapp, trim(_address))
  ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, phone = excluded.phone, whatsapp = excluded.whatsapp, address = excluded.address, updated_at = now();
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_my_doctor_profile(text, text, text, text, text, integer, text, text, text, integer, text, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_my_doctor_profile(text, text, text, text, text, integer, text, text, text, integer, text, text, text, text) TO authenticated;