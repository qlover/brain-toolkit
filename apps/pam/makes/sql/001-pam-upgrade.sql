-- =============================================================================
-- PAM upgrade for EXISTING databases (single script, safe to re-run)
--
-- 000-pam-full-schema.sql is for fresh installs only (it drops tables).
-- This file brings an existing DB up to the same schema without data loss.
-- Keep in sync with 000-pam-full-schema.sql, shared/config/pamTables.ts and
-- shared/auth/permissionKeys.ts
-- =============================================================================


-- #############################################################################
-- 1) Memory KV admin inspect (role key `admin` only)
-- #############################################################################

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_memory_kv_read', 'api', 'get', '/api/admin/memory-kv', 'List process Memory KV cache entries'),
  ('admin_memory_kv_write', 'api', 'post', '/api/admin/memory-kv', 'Delete process Memory KV cache entries')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_memory_kv_read'),
  ('admin_memory_kv_write')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;


-- #############################################################################
-- 2) Transactional mail + forgot password (independent from Supabase Auth mails)
-- #############################################################################
-- Site settings `mail.*` are seeded by the app from code definitions.

CREATE TABLE IF NOT EXISTS public.pam_mail_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL
    CHECK (template IN ('test', 'password_reset', 'password_changed')),
  provider TEXT NOT NULL CHECK (provider IN ('memory', 'resend')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error TEXT,
  body_text TEXT,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_mail_logs IS
  'Transactional mail audit (memory | resend). Admin mail logs page reads this.';
COMMENT ON COLUMN public.pam_mail_logs.body_text IS
  'Plain-text body, only stored for memory provider (dev/test). Null for real providers.';

CREATE INDEX IF NOT EXISTS idx_pam_mail_logs_created
  ON public.pam_mail_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_mail_logs_email_template_created
  ON public.pam_mail_logs (to_email, template, created_at DESC);

ALTER TABLE public.pam_mail_logs ENABLE ROW LEVEL SECURITY;

-- Password reset links; only the SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS public.pam_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_password_reset_tokens IS
  'Forgot-password reset links. Single use; unused tokens are invalidated after a successful reset.';

CREATE INDEX IF NOT EXISTS idx_pam_password_reset_tokens_user_created
  ON public.pam_password_reset_tokens (user_id, created_at DESC);

ALTER TABLE public.pam_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Revoke all browser sessions (pam_session JWT issued before this is rejected).
ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pam_users.sessions_revoked_at IS
  'Session JWTs with iat before this time are rejected (set after password reset).';

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_mail_logs_read', 'api', 'get', '/api/admin/mail-logs', 'List mail send logs'),
  ('admin_mail_test', 'api', 'post', '/api/admin/mail/test', 'Send test email')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_mail_logs_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'operator'
ON CONFLICT DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_mail_logs_read'),
  ('admin_mail_test')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;


-- #############################################################################
-- 3) Remembered OAuth consent ("trust this app" on one device)
-- #############################################################################
-- Early drafts had no device_id; such a table is recreated (trust rows are
-- safe to lose — users just see the consent page once more).

DO $$
BEGIN
  IF to_regclass('public.pam_oauth_consent_grants') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pam_oauth_consent_grants'
        AND column_name = 'device_id'
    ) THEN
    DROP TABLE public.pam_oauth_consent_grants CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pam_oauth_consent_grants (
  user_id text NOT NULL,
  client_id text NOT NULL REFERENCES public.pam_oauth_clients (client_id) ON DELETE CASCADE,
  device_id text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_pam_oauth_consent_grants_user
  ON public.pam_oauth_consent_grants (user_id);

COMMENT ON TABLE public.pam_oauth_consent_grants IS 'Remembered consent ("trust this app") per user + client + device; skip the authorize page for these scopes until expires_at.';
COMMENT ON COLUMN public.pam_oauth_consent_grants.device_id IS 'Random id from the httpOnly pam_oauth_device cookie.';

ALTER TABLE public.pam_oauth_consent_grants ENABLE ROW LEVEL SECURITY;


-- #############################################################################
-- 4) External login identities (brain-oauth sub → PAM user)
-- #############################################################################
-- Before this table, PAM stored the brain-oauth `sub` directly as pam_users.id.

CREATE TABLE IF NOT EXISTS public.pam_user_identities (
  provider text NOT NULL,
  external_user_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  PRIMARY KEY (provider, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pam_user_identities_user
  ON public.pam_user_identities (user_id);

COMMENT ON TABLE public.pam_user_identities IS
  'External login identities mapped to a PAM user (provider = brain: external_user_id is the brain-oauth sub).';

ALTER TABLE public.pam_user_identities ENABLE ROW LEVEL SECURITY;

-- Backfill legacy Brain users (pam_users.id = brain-oauth sub). Works before
-- or after brain-oauth-schema.sql renames links.auth_user_id → user_id
-- (the UUIDs are preserved either way).
DO $$
DECLARE
  link_col text;
BEGIN
  IF to_regclass('public.brain_oauth_user_links') IS NULL THEN
    RETURN;
  END IF;

  SELECT column_name INTO link_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'brain_oauth_user_links'
    AND column_name IN ('auth_user_id', 'user_id')
  LIMIT 1;

  IF link_col IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format(
    'INSERT INTO public.pam_user_identities (provider, external_user_id, user_id)
     SELECT DISTINCT ''brain'', p.id::text, p.id
     FROM public.pam_users p
     JOIN public.brain_oauth_user_links l ON l.%I = p.id
     ON CONFLICT (provider, external_user_id) DO NOTHING',
    link_col
  );
END $$;
