CREATE TABLE public.diet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  title text NOT NULL,
  cells jsonb NOT NULL DEFAULT '[]'::jsonb,
  calories integer,
  notes text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_templates TO authenticated;
GRANT ALL ON public.diet_templates TO service_role;
ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors read own or public templates" ON public.diet_templates FOR SELECT TO authenticated
  USING (doctor_id = public.my_doctor_id() OR (is_public AND public.my_doctor_id() IS NOT NULL) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Doctors create own templates" ON public.diet_templates FOR INSERT TO authenticated WITH CHECK (doctor_id = public.my_doctor_id());
CREATE POLICY "Doctors update own templates" ON public.diet_templates FOR UPDATE TO authenticated USING (doctor_id = public.my_doctor_id()) WITH CHECK (doctor_id = public.my_doctor_id());
CREATE POLICY "Doctors delete own templates" ON public.diet_templates FOR DELETE TO authenticated USING (doctor_id = public.my_doctor_id());