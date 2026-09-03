-- Phone OTP send/verify records for PAM (memory | aliyun DysmsAPI).
-- Admin monitors phone + code for memory; aliyun leaves code_plain null.

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
  'Sending channel: memory (no SMS) | aliyun (DysmsAPI).';

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
  '手机验证码发送通道：memory=不发短信（码进 Admin 监控页）；aliyun=阿里云短信（Admin「阿里云短信」配置）。',
  false
)
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

-- Aliyun DysmsAPI settings (edit in Admin; secret encrypted at app layer).
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES
  (
    'aliyun_sms.access_key_id',
    '""'::jsonb,
    '短信服务 AccessKey ID。建议使用仅短信权限的 RAM 子账号。',
    false
  ),
  (
    'aliyun_sms.access_key_secret',
    '""'::jsonb,
    '短信服务 AccessKey Secret。加密存储，界面不回显明文。',
    true
  ),
  (
    'aliyun_sms.sign_name',
    '""'::jsonb,
    '控制台已审核通过的签名名称（不是签名 ID）。',
    false
  ),
  (
    'aliyun_sms.template_code',
    '""'::jsonb,
    '控制台已审核通过的模板 CODE，须含验证码变量。示例：SMS_123456789',
    false
  ),
  (
    'aliyun_sms.template_param_key',
    '"code"'::jsonb,
    '模板 JSON 中验证码字段名。默认 code → TemplateParam={"code":"123456"}。',
    false
  ),
  (
    'aliyun_sms.region_id',
    '"cn-hangzhou"'::jsonb,
    'DysmsAPI RegionId。默认 cn-hangzhou。',
    false
  ),
  (
    'aliyun_sms.endpoint',
    '"https://dysmsapi.aliyuncs.com"'::jsonb,
    'DysmsAPI 地址。默认 https://dysmsapi.aliyuncs.com。一般无需修改。',
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
