CREATE TABLE public.popup_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title_bn text NOT NULL CHECK (length(trim(title_bn)) BETWEEN 1 AND 120),
 title_en text NOT NULL DEFAULT '' CHECK (length(title_en) <= 120),
 body_bn text NOT NULL CHECK (length(trim(body_bn)) BETWEEN 1 AND 3000),
 body_en text NOT NULL DEFAULT '' CHECK (length(body_en) <= 3000),
 audience text NOT NULL CHECK (audience IN ('doctor', 'patient', 'both')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popup_messages TO authenticated;
GRANT ALL ON public.popup_messages TO service_role;
ALTER TABLE public.popup_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY popup_admin_manage ON public.popup_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY popup_target_read ON public.popup_messages FOR SELECT TO authenticated USING (active AND ((audience IN ('doctor','both') AND public.has_role(auth.uid(), 'doctor')) OR (audience IN ('patient','both') AND public.has_role(auth.uid(), 'patient'))));
CREATE TABLE public.popup_dismissals (
 message_id uuid NOT NULL REFERENCES public.popup_messages(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 dismissed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (message_id,user_id)
);
GRANT SELECT, INSERT ON public.popup_dismissals TO authenticated;
GRANT ALL ON public.popup_dismissals TO service_role;
ALTER TABLE public.popup_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY popup_dismissal_read ON public.popup_dismissals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY popup_dismissal_insert ON public.popup_dismissals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.popup_messages WHERE id = message_id AND active));
CREATE INDEX popup_messages_active_created ON public.popup_messages (created_at DESC) WHERE active;