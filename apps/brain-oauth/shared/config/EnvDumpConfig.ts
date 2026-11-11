/**
 * 临时 env dump 白名单与开关键名。
 *
 * ### 为何存在
 * 从正在运行的 brain-oauth 进程导出平台变量明文，便于一次性导入 PAM。
 * **用完必须删除本功能并关掉 Vercel 上的开关变量。**
 */
export const ENV_DUMP_ENABLED_KEY = 'ENV_DUMP_ENABLED' as const;

/** 与请求头 `x-env-dump-token` 比对的一次性密钥。 */
export const ENV_DUMP_TOKEN_KEY = 'ENV_DUMP_TOKEN' as const;

export const ENV_DUMP_TOKEN_HEADER = 'x-env-dump-token' as const;

/**
 * 允许导出的键（与 `.env.template` 服务端段对齐，可按需增删）。
 * 禁止全量 `Object.keys(process.env)`。
 */
export const ENV_DUMP_ALLOWLIST = [
  'SITE_URL',
  'APP_ENV',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'CEREBRAS_API_KEY',
  'CEREBRAS_BASE_URL',
  'LOG_LEVEL',
  'LOG_PREFIX_TEMPLATE',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'API_CORS_ALLOWED_ORIGINS',
  'API_CORS_ALLOWED_METHODS',
  'BRAIN_ADMIN_ENVS',
  'BRAIN_USER_PROXY_BASE_URL',
  'BRAIN_USER_PROXY_ENDPOINTS',
  'OAUTH_SESSION_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_LOG_LEVEL',
  'NEXT_PUBLIC_LOGIN_USER',
  'NEXT_PUBLIC_LOGIN_PASSWORD',
  'NEXT_PUBLIC_STRING_ENCRYPT_KEY',
  'NEXT_PUBLIC_USER_TOKEN_KEY'
] as const;

export type EnvDumpAllowlistKeyType = (typeof ENV_DUMP_ALLOWLIST)[number];
