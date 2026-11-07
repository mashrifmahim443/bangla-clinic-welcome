ALTER TABLE public.sms_history ADD COLUMN request_id uuid UNIQUE;
ALTER TABLE public.sms_history ADD COLUMN sent_by uuid;
ALTER TABLE public.sms_history ADD COLUMN message_text text;
COMMENT ON COLUMN public.sms_history.request_id IS 'Unique client action ID prevents repeated provider calls for the same submission.';