-- PAM application user profiles (1:1 with auth.users).
-- Platform admin and future team membership metadata live here; auth.users stays identity-only.

CREATE TABLE IF NOT EXISTS public.pam_users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_users IS 'PAM user profile and platform-level roles; FK to auth.users.';
COMMENT ON COLUMN public.pam_users.is_platform_admin IS 'Platform admin: /admin UI and /api/admin/* access.';
COMMENT ON COLUMN public.pam_users.status IS 'Application account status (not Supabase auth ban).';

CREATE INDEX IF NOT EXISTS idx_pam_users_email ON public.pam_users (email);
CREATE INDEX IF NOT EXISTS idx_pam_users_platform_admin ON public.pam_users (is_platform_admin)
  WHERE is_platform_admin = TRUE;

ALTER TABLE public.pam_users ENABLE ROW LEVEL SECURITY;

-- No policies: service_role only (same pattern as pam_site_settings).

CREATE OR REPLACE FUNCTION public.pam_users_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_users_updated_at ON public.pam_users;
CREATE TRIGGER trigger_pam_users_updated_at
BEFORE UPDATE ON public.pam_users
FOR EACH ROW EXECUTE FUNCTION public.pam_users_set_updated_at();

-- Bootstrap first platform admin (edit email before running in production):
-- INSERT INTO public.pam_users (id, email, is_platform_admin)
-- SELECT id, coalesce(email, ''), TRUE FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (id) DO UPDATE SET is_platform_admin = TRUE, email = EXCLUDED.email;
