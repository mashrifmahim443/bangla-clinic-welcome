CREATE TABLE public.registration_verifications (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 required boolean NOT NULL DEFAULT true,
 verified_phone text,
 phone_verified_at timestamptz
);
GRANT SELECT ON public.registration_verifications TO authenticated;
GRANT ALL ON public.registration_verifications TO service_role;
ALTER TABLE public.registration_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY registration_verification_own_read ON public.registration_verifications FOR SELECT TO authenticated USING (user_id=auth.uid());
INSERT INTO public.registration_verifications(user_id,required) SELECT id,false FROM public.profiles;
CREATE FUNCTION public.initialize_registration_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.registration_verifications(user_id) VALUES (NEW.id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.initialize_registration_verification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER initialize_registration_verification AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_registration_verification();
CREATE FUNCTION public.registration_contacts_verified(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS (SELECT 1 FROM public.registration_verifications v JOIN public.profiles p ON p.id=v.user_id JOIN auth.users u ON u.id=v.user_id WHERE v.user_id=_user AND (NOT v.required OR (u.email_confirmed_at IS NOT NULL AND v.phone_verified_at IS NOT NULL AND v.verified_phone=p.phone)));
$$;
REVOKE ALL ON FUNCTION public.registration_contacts_verified(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.registration_contacts_verified(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_active_user(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.registration_contacts_verified(_user) AND (public.has_role(_user,'admin') OR EXISTS (SELECT 1 FROM public.profiles WHERE id=_user AND account_status='active')); $$;
CREATE FUNCTION public.invalidate_phone_verification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.phone IS DISTINCT FROM OLD.phone THEN UPDATE public.registration_verifications SET verified_phone=NULL,phone_verified_at=NULL WHERE user_id=NEW.id AND required; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.invalidate_phone_verification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER invalidate_phone_verification AFTER UPDATE OF phone ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.invalidate_phone_verification();
CREATE FUNCTION public.guard_profile_approval() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.account_status IS DISTINCT FROM OLD.account_status AND current_user IN ('authenticated','anon') AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can change account approval'; END IF; RETURN NEW; END $$;
CREATE TRIGGER guard_profile_approval BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_approval();
CREATE TABLE public.phone_verification_challenges (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 challenge_id uuid NOT NULL,
 phone text NOT NULL,
 code_hash text NOT NULL,
 expires_at timestamptz NOT NULL,
 sent_at timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0,
 consumed boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.phone_verification_challenges TO service_role;
ALTER TABLE public.phone_verification_challenges ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.phone_verification_rate_limits (
 bucket text PRIMARY KEY,
 window_start timestamptz NOT NULL,
 hits integer NOT NULL
);
GRANT ALL ON public.phone_verification_rate_limits TO service_role;
ALTER TABLE public.phone_verification_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_phone_verification(_user uuid,_phone text,_hash text,_challenge uuid,_ip_hash text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b text; n integer; lim integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(_user::text,0));
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user AND email_confirmed_at IS NOT NULL) THEN RETURN 'email_required'; END IF;
 IF _phone !~ '^01[3-9][0-9]{8}$' THEN RETURN 'invalid_phone'; END IF;
 IF EXISTS(SELECT 1 FROM public.phone_verification_challenges WHERE user_id=_user AND sent_at > now()-interval '60 seconds') THEN RETURN 'cooldown'; END IF;
 FOREACH b IN ARRAY ARRAY['user:'||_user::text,'phone:'||_phone,'ip:'||_ip_hash] LOOP
 lim:=CASE WHEN b LIKE 'ip:%' THEN 20 ELSE 5 END;
 INSERT INTO public.phone_verification_rate_limits(bucket,window_start,hits) VALUES(b,now(),1)
 ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN phone_verification_rate_limits.window_start <= now()-interval '1 hour' THEN 1 ELSE phone_verification_rate_limits.hits+1 END, window_start=CASE WHEN phone_verification_rate_limits.window_start <= now()-interval '1 hour' THEN now() ELSE phone_verification_rate_limits.window_start END RETURNING hits INTO n;
 IF n>lim THEN RETURN 'rate_limited'; END IF;
 END LOOP;
 UPDATE public.profiles SET phone=_phone WHERE id=_user;
 INSERT INTO public.phone_verification_challenges(user_id,challenge_id,phone,code_hash,expires_at) VALUES(_user,_challenge,_phone,_hash,now()+interval '5 minutes')
 ON CONFLICT(user_id) DO UPDATE SET challenge_id=_challenge,phone=_phone,code_hash=_hash,expires_at=now()+interval '5 minutes',sent_at=now(),attempts=0,consumed=false;
 RETURN 'claimed';
END $$;
REVOKE ALL ON FUNCTION public.claim_phone_verification(uuid,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_phone_verification(uuid,text,text,uuid,text) TO service_role;
CREATE FUNCTION public.consume_phone_verification(_user uuid,_hash text,_challenge uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.phone_verification_challenges;
BEGIN
 SELECT * INTO c FROM public.phone_verification_challenges WHERE user_id=_user FOR UPDATE;
 IF NOT FOUND OR c.challenge_id<>_challenge THEN RETURN 'invalid'; END IF;
 IF c.consumed THEN RETURN 'used'; END IF;
 IF c.expires_at<=now() THEN RETURN 'expired'; END IF;
 IF c.attempts>=5 THEN RETURN 'locked'; END IF;
 UPDATE public.phone_verification_challenges SET attempts=attempts+1 WHERE user_id=_user;
 IF c.code_hash<>_hash THEN RETURN 'invalid'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=_user AND p.phone=c.phone AND u.email_confirmed_at IS NOT NULL) THEN RETURN 'invalid'; END IF;
 UPDATE public.phone_verification_challenges SET consumed=true WHERE user_id=_user;
 UPDATE public.registration_verifications SET verified_phone=c.phone,phone_verified_at=now() WHERE user_id=_user;
 RETURN 'verified';
END $$;
REVOKE ALL ON FUNCTION public.consume_phone_verification(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_phone_verification(uuid,text,uuid) TO service_role;
DO $$ DECLARE tbl record; BEGIN FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('profiles','registration_verifications','phone_verification_challenges','phone_verification_rate_limits') LOOP EXECUTE format('CREATE POLICY registration_verification_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.registration_contacts_verified(auth.uid())) WITH CHECK (public.registration_contacts_verified(auth.uid()))',tbl.tablename); END LOOP; END $$;