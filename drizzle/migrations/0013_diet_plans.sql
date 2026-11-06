CREATE TABLE public.diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  appointment_id uuid REFERENCES public.appointments(id),
  cells jsonb NOT NULL DEFAULT '[]'::jsonb,
  calories integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, doctor_id)
);
GRANT SELECT, INSERT, UPDATE ON public.diet_plans TO authenticated;
GRANT ALL ON public.diet_plans TO service_role;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient reads own diet" ON public.diet_plans FOR SELECT TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "Doctor reads diet they wrote" ON public.diet_plans FOR SELECT TO authenticated USING (doctor_id = public.my_doctor_id());
CREATE POLICY "Doctor writes diet" ON public.diet_plans FOR INSERT TO authenticated WITH CHECK (doctor_id = public.my_doctor_id() AND public.is_doctor_of_patient(patient_id));
CREATE POLICY "Doctor updates diet" ON public.diet_plans FOR UPDATE TO authenticated USING (doctor_id = public.my_doctor_id()) WITH CHECK (doctor_id = public.my_doctor_id());