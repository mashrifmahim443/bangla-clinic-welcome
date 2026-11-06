ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS diagnosed_year integer,
  ADD COLUMN IF NOT EXISTS medicines text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS other_conditions text,
  ADD COLUMN IF NOT EXISTS emergency_contact text;

CREATE OR REPLACE FUNCTION public.profile_completion(_user uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    (CASE WHEN nullif(trim(full_name),'') IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN nullif(trim(phone),'') IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN nullif(trim(address),'') IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN birth_year IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN nullif(gender,'') IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN diabetes_type IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN diagnosed_year IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN nullif(trim(medicines),'') IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN weight_kg IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN height_cm IS NOT NULL THEN 1 ELSE 0 END)
  ) * 10, 0)::integer FROM public.profiles WHERE id = _user
$$;

DROP POLICY IF EXISTS "Patients book for themselves" ON public.appointments;
CREATE POLICY "Patients book for themselves" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id AND slot_start > now() AND COALESCE(public.profile_completion(auth.uid()), 0) >= 60);