CREATE TABLE public.old_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  file_path text NOT NULL,
  file_name text NOT NULL,
  doctor_name text,
  rx_date date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.old_prescriptions TO authenticated;
GRANT ALL ON public.old_prescriptions TO service_role;
ALTER TABLE public.old_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own old rx read" ON public.old_prescriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_doctor_of_patient(user_id));
CREATE POLICY "Own old rx insert" ON public.old_prescriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own old rx delete" ON public.old_prescriptions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Old rx files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'old-prescriptions' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_doctor_of_patient(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Old rx files upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'old-prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Old rx files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'old-prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);