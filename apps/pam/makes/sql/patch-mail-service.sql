-- Existing DBs: transactional mail service + forgot password (independent from Supabase Auth mails).
-- Keep permission keys in sync with apps/pam/shared/auth/permissionKeys.ts
-- Site settings `mail.*` are seeded by the app from code definitions.

-- ---------------------------------------------------------------------------
-- 1) Mail send audit
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 2) Password reset tokens (link flow; only SHA-256 hash is stored)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3) Revoke all browser sessions (pam_session JWT issued before this is rejected)
-- ---------------------------------------------------------------------------

ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pam_users.sessions_revoked_at IS
  'Session JWTs with iat before this time are rejected (set after password reset).';

-- ---------------------------------------------------------------------------
-- 4) Permission catalog + role assignments
-- ---------------------------------------------------------------------------

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
