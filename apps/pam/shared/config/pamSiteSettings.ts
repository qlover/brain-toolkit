export const PAM_SITE_SETTING_KEYS = {
  AUTH_PHONE_LOGIN_ENABLED: 'auth.phone_login_enabled',
  AUTH_PHONE_OTP_PROVIDER: 'auth.phone_otp_provider',
  AUTH_GOOGLE_OAUTH_ENABLED: 'auth.google_oauth_enabled',
  AUTH_BRAIN_PKCE_ENABLED: 'auth.brain_pkce_enabled',
  AUTH_BRAIN_SUPABASE_ENABLED: 'auth.brain_supabase_enabled',
  AUTH_CLI_TOKEN_EXPIRES_IN: 'auth.cli_token_expires_in',

  BRAIN_OAUTH_SITE_URL: 'brain_oauth.site_url',
  BRAIN_OAUTH_CLIENT_ID: 'brain_oauth.client_id',
  BRAIN_OAUTH_CLIENT_SECRET: 'brain_oauth.client_secret',
  BRAIN_OAUTH_REDIRECT_URI: 'brain_oauth.redirect_uri',
  BRAIN_OAUTH_SCOPES: 'brain_oauth.scopes',
  BRAIN_OAUTH_LOCALE: 'brain_oauth.locale',

  OPENAI_API_KEY: 'openai.api_key',
  OPENAI_BASE_URL: 'openai.base_url',

  ALIYUN_SMS_ACCESS_KEY_ID: 'aliyun_sms.access_key_id',
  ALIYUN_SMS_ACCESS_KEY_SECRET: 'aliyun_sms.access_key_secret',
  ALIYUN_SMS_SIGN_NAME: 'aliyun_sms.sign_name',
  ALIYUN_SMS_TEMPLATE_CODE: 'aliyun_sms.template_code',
  ALIYUN_SMS_TEMPLATE_PARAM_KEY: 'aliyun_sms.template_param_key',
  ALIYUN_SMS_REGION_ID: 'aliyun_sms.region_id',
  ALIYUN_SMS_ENDPOINT: 'aliyun_sms.endpoint',

  API_CORS_ORIGINS: 'api.cors_origins',
  API_CORS_METHODS: 'api.cors_methods',

  STORAGE_PREVIEW_BUCKET: 'storage.preview_bucket',
  STORAGE_SCREENSHOT_URL_TEMPLATE: 'storage.screenshot_url_template'
} as const;

export type PamSiteSettingKey =
  (typeof PAM_SITE_SETTING_KEYS)[keyof typeof PAM_SITE_SETTING_KEYS];

export type PamSiteSettingPrimitive = string | boolean | string[];

export type PamSiteSettingDefinition = {
  readonly key: PamSiteSettingKey;
  /** Short title shown in Admin UI. */
  readonly label: string;
  /** Help text for operators (Chinese). */
  readonly description: string;
  readonly isSensitive: boolean;
  readonly defaultValue?: PamSiteSettingPrimitive;
};

/** Sentinel: admin PATCH omits secret change when value equals this. */
export const PAM_SITE_SETTING_SECRET_UNCHANGED = '__UNCHANGED__' as const;

export const PAM_SITE_SETTING_DEFINITIONS: readonly PamSiteSettingDefinition[] =
  Object.freeze([
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_PHONE_LOGIN_ENABLED,
      label: '手机验证码登录',
      description:
        '是否在登录页展示「手机号」Tab。memory：码在 Admin「验证码监控」查看；aliyun：阿里云真实短信。',
      isSensitive: false,
      defaultValue: true
    },
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_PHONE_OTP_PROVIDER,
      label: '手机验证码通道',
      description:
        'memory=不发短信，码写入 pam_phone_otps 供 Admin 监控；aliyun=阿里云短信（在「阿里云短信」分组配置）。',
      isSensitive: false,
      defaultValue: 'memory'
    },
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_GOOGLE_OAUTH_ENABLED,
      label: 'Google 登录',
      description:
        '是否在登录页展示 Google OAuth 按钮。需在 Supabase Auth 中启用 Google 提供商。',
      isSensitive: false,
      defaultValue: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED,
      label: 'Brain PKCE 登录',
      description:
        '是否启用 Brain OAuth 授权码 + PKCE 流程（PAM 直连 brain-oauth）。适合本地或已配置 CORS 的跨域场景。',
      isSensitive: false,
      defaultValue: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_BRAIN_SUPABASE_ENABLED,
      label: 'Brain Supabase SSO',
      description:
        '是否启用 Supabase custom:brain 联合登录。Brain AS 须能被 Supabase 公网访问，本地 localhost 通常不可用。',
      isSensitive: false,
      defaultValue: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.AUTH_CLI_TOKEN_EXPIRES_IN,
      label: 'CLI Token 有效期',
      description:
        'pamenv CLI Bearer JWT 的有效期（ms 格式，如 30d、7d）。到期或 pam logout 后需重新登录。',
      isSensitive: false,
      defaultValue: '30d'
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SITE_URL,
      label: 'Brain OAuth 站点地址',
      description:
        'brain-oauth 服务根 URL，不含末尾斜杠。示例：http://localhost:3122',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_ID,
      label: 'Brain OAuth Client ID',
      description: '在 Brain OAuth 开发者控制台注册的 client_id。',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_SECRET,
      label: 'Brain OAuth Client Secret',
      description:
        '机密客户端密钥；纯 PKCE 公共客户端可留空。保存后加密存储，界面不回显明文。',
      isSensitive: true
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_REDIRECT_URI,
      label: 'Brain OAuth 回调地址',
      description:
        '须与 Brain OAuth 控制台 redirect_uri 完全一致。留空时默认 {SITE_URL}/api/callback/brain-oauth。',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SCOPES,
      label: 'Brain OAuth Scopes',
      description: '授权 scope，空格分隔。默认 openid profile email。',
      isSensitive: false,
      defaultValue: 'openid profile email'
    },
    {
      key: PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_LOCALE,
      label: 'Brain OAuth 授权页语言',
      description: '固定授权页 locale（en | zh）。留空则使用用户当前 UI 语言。',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.OPENAI_API_KEY,
      label: 'OpenAI 兼容 API Key',
      description:
        'OpenAI 或兼容网关（Cerebras、自建代理等）的 API 密钥。加密存储，界面不回显明文。',
      isSensitive: true
    },
    {
      key: PAM_SITE_SETTING_KEYS.OPENAI_BASE_URL,
      label: 'OpenAI 兼容 Base URL',
      description:
        'Chat Completions 兼容接口根地址。示例：https://api.openai.com/v1',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ACCESS_KEY_ID,
      label: '阿里云 AccessKey ID',
      description: '短信服务 AccessKey ID。建议使用仅短信权限的 RAM 子账号。',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ACCESS_KEY_SECRET,
      label: '阿里云 AccessKey Secret',
      description: '短信服务 AccessKey Secret。加密存储，界面不回显明文。',
      isSensitive: true
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_SIGN_NAME,
      label: '短信签名',
      description: '控制台已审核通过的签名名称（不是签名 ID）。',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_TEMPLATE_CODE,
      label: '短信模板 CODE',
      description:
        '控制台已审核通过的模板 CODE，须含验证码变量。示例：SMS_123456789',
      isSensitive: false
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_TEMPLATE_PARAM_KEY,
      label: '模板验证码变量名',
      description:
        '模板 JSON 中验证码字段名。默认 code → TemplateParam={"code":"123456"}。',
      isSensitive: false,
      defaultValue: 'code'
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_REGION_ID,
      label: '短信 API 地域',
      description: 'DysmsAPI RegionId。默认 cn-hangzhou。',
      isSensitive: false,
      defaultValue: 'cn-hangzhou'
    },
    {
      key: PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ENDPOINT,
      label: '短信 API Endpoint',
      description:
        'DysmsAPI 地址。默认 https://dysmsapi.aliyuncs.com。一般无需修改。',
      isSensitive: false,
      defaultValue: 'https://dysmsapi.aliyuncs.com'
    },
    {
      key: PAM_SITE_SETTING_KEYS.API_CORS_ORIGINS,
      label: 'CORS 允许来源',
      description:
        '逗号分隔的跨域白名单 Origin。用于 /oauth/token 等机器端点。留空表示不启用 CORS。',
      isSensitive: false,
      defaultValue: []
    },
    {
      key: PAM_SITE_SETTING_KEYS.API_CORS_METHODS,
      label: 'CORS 允许方法',
      description: '逗号分隔的 HTTP 方法列表。默认 GET,POST,OPTIONS。',
      isSensitive: false,
      defaultValue: ['GET', 'POST', 'OPTIONS']
    },
    {
      key: PAM_SITE_SETTING_KEYS.STORAGE_PREVIEW_BUCKET,
      label: '预览图 Storage Bucket',
      description:
        '项目封面/预览图上传的 Supabase Storage bucket 名称。默认 pam-previews。',
      isSensitive: false,
      defaultValue: 'pam-previews'
    },
    {
      key: PAM_SITE_SETTING_KEYS.STORAGE_SCREENSHOT_URL_TEMPLATE,
      label: '截图服务 URL 模板',
      description:
        '生成项目预览图时使用的截图服务地址，{url} 为占位符。留空则使用 Microlink 默认。',
      isSensitive: false
    }
  ]);

const definitionByKey = new Map(
  PAM_SITE_SETTING_DEFINITIONS.map((definition) => [definition.key, definition])
);

export function getPamSiteSettingDefinition(
  key: PamSiteSettingKey
): PamSiteSettingDefinition {
  const definition = definitionByKey.get(key);
  if (!definition) {
    throw new Error(`Unknown site setting key: ${key}`);
  }
  return definition;
}

export const PAM_PUBLIC_SITE_SETTING_KEYS = [
  PAM_SITE_SETTING_KEYS.AUTH_PHONE_LOGIN_ENABLED,
  PAM_SITE_SETTING_KEYS.AUTH_GOOGLE_OAUTH_ENABLED,
  PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED,
  PAM_SITE_SETTING_KEYS.AUTH_BRAIN_SUPABASE_ENABLED
] as const;

export type PamPublicSiteSettingKey =
  (typeof PAM_PUBLIC_SITE_SETTING_KEYS)[number];
