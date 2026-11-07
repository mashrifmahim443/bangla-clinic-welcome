ALTER TABLE public.doctors ADD COLUMN is_verified boolean NOT NULL DEFAULT false, ADD COLUMN is_special boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.doctors.is_verified IS 'Admin-awarded verified badge; independent of role assignment and activation.';
COMMENT ON COLUMN public.doctors.is_special IS 'Admin-awarded special badge.';