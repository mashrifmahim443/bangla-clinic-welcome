CREATE TABLE public.sms_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sent_at timestamptz,
 recipient text NOT NULL CHECK (recipient ~ '^(01[0-9]{9}|8801[0-9]{9})$'),
 provider text NOT NULL DEFAULT 'Automas',
 http_status integer,
 provider_status integer,
 delivery_status text NOT NULL DEFAULT 'unknown' CHECK (delivery_status IN ('pending','accepted','delivered','failed','unknown','recipient_confirmed')),
 delivery_source text NOT NULL DEFAULT 'none' CHECK (delivery_source IN ('none','provider','recipient')),
 delivery_updated_at timestamptz,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT sms_confirmed_source CHECK (delivery_status <> 'recipient_confirmed' OR delivery_source = 'recipient')
);
GRANT SELECT ON public.sms_history TO authenticated;
GRANT ALL ON public.sms_history TO service_role;
ALTER TABLE public.sms_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read SMS history" ON public.sms_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX sms_history_recorded_at_idx ON public.sms_history (recorded_at DESC);
COMMENT ON TABLE public.sms_history IS 'Append-only SMS results written by trusted service code; no raw provider responses, credentials or URLs. Acceptance is not proof of delivery; recipient confirmation is separate from provider receipts.';