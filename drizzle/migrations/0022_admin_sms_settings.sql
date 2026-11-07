CREATE TABLE public.sms_settings (
 id text PRIMARY KEY DEFAULT 'automas' CHECK (id = 'automas'),
 sender_id text NOT NULL CHECK (sender_id ~ '^[A-Za-z0-9+_-]{3,32}$'),
 test_number text NOT NULL DEFAULT '' CHECK (test_number = '' OR test_number ~ '^(01[0-9]{9}|8801[0-9]{9})$'),
 message_template text NOT NULL DEFAULT '' CHECK (length(message_template) <= 1000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sms_settings TO authenticated;
GRANT ALL ON public.sms_settings TO service_role;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read SMS settings" ON public.sms_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert SMS settings" ON public.sms_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update SMS settings" ON public.sms_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
COMMENT ON TABLE public.sms_settings IS 'Admin-only non-secret Automas configuration. API credentials are held exclusively in the encrypted project secret store.';