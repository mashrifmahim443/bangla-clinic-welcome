-- Account approval
ALTER TABLE public.profiles ADD COLUMN account_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_chk CHECK (account_status IN ('pending','active','blocked'));
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.is_active_user(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select public.has_role(_user,'admin') or exists (select 1 from public.profiles where id = _user and account_status = 'active')
$$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(_user uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  if _status not in ('pending','active','blocked') then raise exception 'bad status'; end if;
  if _user = auth.uid() then raise exception 'cannot change own status'; end if;
  update public.profiles set account_status = _status where id = _user;
end $$;

DROP FUNCTION public.admin_users();
CREATE FUNCTION public.admin_users()
RETURNS TABLE(id uuid, email text, full_name text, phone text, roles app_role[], created_at timestamptz, readings bigint, account_status text, deletion_requested boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$ begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query select u.id, u.email::text, p.full_name, p.phone,
    coalesce(array_agg(r.role) filter (where r.role is not null), '{}'), u.created_at,
    (select count(*) from public.glucose_readings g where g.user_id = u.id),
    coalesce(p.account_status,'pending'),
    exists (select 1 from public.deletion_requests d where d.user_id = u.id and d.status = 'open')
  from auth.users u left join public.profiles p on p.id = u.id left join public.user_roles r on r.user_id = u.id
  group by u.id, p.full_name, p.phone, p.account_status;
end $$;

-- Booking requires active account
DROP POLICY "Patients book for themselves" ON public.appointments;
CREATE POLICY "Patients book for themselves" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id AND slot_start > now() AND COALESCE(public.profile_completion(auth.uid()),0) >= 60 AND public.is_active_user(auth.uid()));

-- Deletion requests
CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  reason text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deletion_requests TO authenticated;
GRANT ALL ON public.deletion_requests TO service_role;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own deletion request create" ON public.deletion_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'open');
CREATE POLICY "Own or admin read deletion requests" ON public.deletion_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin updates deletion requests" ON public.deletion_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Editable site content
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site content is public" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin inserts content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin updates content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Doctors: photo, suspend, admin add/remove
ALTER TABLE public.doctors ADD COLUMN photo_url text;
ALTER TABLE public.doctors ADD COLUMN active boolean NOT NULL DEFAULT true;
GRANT INSERT, DELETE ON public.doctors TO authenticated;
DROP POLICY "Doctors are public" ON public.doctors;
CREATE POLICY "Doctors are public" ON public.doctors FOR SELECT TO anon, authenticated
  USING (active OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins add doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins remove doctors" ON public.doctors FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Site media bucket policies
CREATE POLICY "Site media public read" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "Admin uploads site media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes site media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));