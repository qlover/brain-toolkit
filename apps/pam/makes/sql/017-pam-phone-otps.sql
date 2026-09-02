-- Phone OTP send/verify records for PAM (memory provider now; aliyun later).
-- Admin monitors phone + code here; production aliyun may leave code_plain null.

CREATE TABLE IF NOT EXISTS public.pam_phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_plain TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('memory', 'aliyun')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'revoked')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_phone_otps IS
  'Phone OTP send/verify audit. memory stores code_plain for Admin; aliyun may omit plaintext.';
COMMENT ON COLUMN public.pam_phone_otps.code_plain IS
  'Plain OTP for Admin monitoring (memory/test). Null in production SMS providers.';
COMMENT ON COLUMN public.pam_phone_otps.provider IS
  'Sending channel: memory (no SMS) | aliyun (future).';

CREATE INDEX IF NOT EXISTS idx_pam_phone_otps_phone_created
  ON public.pam_phone_otps (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_phone_otps_status_created
  ON public.pam_phone_otps (status, created_at DESC);

ALTER TABLE public.pam_phone_otps ENABLE ROW LEVEL SECURITY;

-- Link phone identity on pam_users for find-or-create after OTP verify.
ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.pam_users.phone IS
  'E.164 phone for phone-OTP users; unique when present.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_users_phone_unique
  ON public.pam_users (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- Provider switch (memory | aliyun). Default memory for test flow without Twilio.
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES (
  'auth.phone_otp_provider',
  '"memory"'::jsonb,
  '手机验证码发送通道：memory=不发短信（码进 Admin 监控页）；aliyun=阿里云短信（后续接入）。',
  false
)
ON CONFLICT (key) DO NOTHING;

-- Keep phone login tab enabled when using PAM memory OTP.
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES (
  'auth.phone_login_enabled',
  'true'::jsonb,
  '是否在登录页展示「手机号」Tab。memory 模式下码在 Admin「验证码监控」查看；aliyun 模式走真实短信。',
  false
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;
