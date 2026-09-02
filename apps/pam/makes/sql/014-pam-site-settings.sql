-- Site-wide runtime settings (feature flags, integrations, etc.)
-- Sensitive values are encrypted at the application layer (enc:v1: prefix).
-- Runtime reads this table only; change values in Admin /admin/settings (not .env).

create table if not exists public.pam_site_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  is_sensitive boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.pam_site_settings is
  'PAM runtime site settings. Seeded on migration; edit via Admin console.';

comment on column public.pam_site_settings.key is
  'Dotted setting key, e.g. auth.phone_login_enabled, brain_oauth.site_url.';

comment on column public.pam_site_settings.value is
  'JSON value (string, boolean, string[], etc.). Sensitive values are stored encrypted.';

comment on column public.pam_site_settings.description is
  'Human-readable description of what this setting does (for operators / Admin UI).';

comment on column public.pam_site_settings.is_sensitive is
  'True when value is sensitive (encrypted at rest); never exposed via public API.';

comment on column public.pam_site_settings.updated_at is
  'Last update time.';

create index if not exists idx_pam_site_settings_updated_at
  on public.pam_site_settings (updated_at desc);

alter table public.pam_site_settings enable row level security;

-- No RLS policies: only service_role (admin client) reads/writes from server.

-- Default rows (idempotent). Re-run safe: ON CONFLICT DO NOTHING.
insert into public.pam_site_settings (key, value, description, is_sensitive) values
  (
    'auth.phone_login_enabled',
    'false'::jsonb,
    '是否在登录页展示「手机号」Tab 并允许短信验证码登录。需 Supabase SMS 或测试 OTP 已正确配置。',
    false
  ),
  (
    'auth.google_oauth_enabled',
    'false'::jsonb,
    '是否在登录页展示 Google OAuth 按钮。需在 Supabase Auth 中启用 Google 提供商。',
    false
  ),
  (
    'auth.brain_pkce_enabled',
    'false'::jsonb,
    '是否启用 Brain OAuth 授权码 + PKCE 流程（PAM 直连 brain-oauth）。适合本地或已配置 CORS 的跨域场景。',
    false
  ),
  (
    'auth.brain_supabase_enabled',
    'false'::jsonb,
    '是否启用 Supabase custom:brain 联合登录。Brain AS 须能被 Supabase 公网访问，本地 localhost 通常不可用。',
    false
  ),
  (
    'auth.cli_token_expires_in',
    '"30d"'::jsonb,
    'pamenv CLI Bearer JWT 的有效期（ms 格式，如 30d、7d）。到期或 pam logout 后需重新登录。',
    false
  ),
  (
    'brain_oauth.site_url',
    '""'::jsonb,
    'brain-oauth 服务根 URL，不含末尾斜杠。示例：http://localhost:3122',
    false
  ),
  (
    'brain_oauth.client_id',
    '""'::jsonb,
    '在 Brain OAuth 开发者控制台注册的 client_id。',
    false
  ),
  (
    'brain_oauth.client_secret',
    '""'::jsonb,
    '机密客户端密钥；纯 PKCE 公共客户端可留空。保存后加密存储，界面不回显明文。',
    true
  ),
  (
    'brain_oauth.redirect_uri',
    '""'::jsonb,
    '须与 Brain OAuth 控制台 redirect_uri 完全一致。留空时默认 {SITE_URL}/api/callback/brain-oauth。',
    false
  ),
  (
    'brain_oauth.scopes',
    '"openid profile email"'::jsonb,
    '授权 scope，空格分隔。默认 openid profile email。',
    false
  ),
  (
    'brain_oauth.locale',
    '""'::jsonb,
    '固定授权页 locale（en | zh）。留空则使用用户当前 UI 语言。',
    false
  ),
  (
    'openai.api_key',
    '""'::jsonb,
    'OpenAI 或兼容网关（Cerebras、自建代理等）的 API 密钥。加密存储，界面不回显明文。',
    true
  ),
  (
    'openai.base_url',
    '""'::jsonb,
    'Chat Completions 兼容接口根地址。示例：https://api.openai.com/v1',
    false
  ),
  (
    'api.cors_origins',
    '[]'::jsonb,
    '逗号分隔的跨域白名单 Origin。用于 /oauth/token 等机器端点。留空表示不启用 CORS。',
    false
  ),
  (
    'api.cors_methods',
    '["GET","POST","OPTIONS"]'::jsonb,
    '逗号分隔的 HTTP 方法列表。默认 GET,POST,OPTIONS。',
    false
  ),
  (
    'storage.preview_bucket',
    '"pam-previews"'::jsonb,
    '项目封面/预览图上传的 Supabase Storage bucket 名称。默认 pam-previews。',
    false
  ),
  (
    'storage.screenshot_url_template',
    '""'::jsonb,
    '生成项目预览图时使用的截图服务地址，{url} 为占位符。留空则使用 Microlink 默认。',
    false
  )
on conflict (key) do nothing;

-- Bootstrap-only: LOG_LEVEL / NEXT_PUBLIC_LOG_LEVEL in .env (not site settings).
delete from public.pam_site_settings where key = 'system.log_level';

alter table public.pam_site_settings drop column if exists updated_by;
