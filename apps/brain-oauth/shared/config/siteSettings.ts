import {
  SITE_SETTING_CORS_RULES_KEY,
  SiteSettingRegistry,
  type SiteSettingDefinition
} from '@brain-toolkit/next-app-kit/shared';
export const SITE_SETTING_KEYS = {
  /**
   * CORS rules: origin × path × methods (`{ origin, path, methods }`, any part may be `*`).
   * Applies to /oauth/token, /oauth/userinfo, /oauth/revoke and /api/user/logout.
   */
  API_CORS_RULES: SITE_SETTING_CORS_RULES_KEY,
  /** JSON of `BrainApiGatewaySettings` (subset of `BrainUserGatewayConfig`). */
  BRAIN_API_GATEWAY_CONFIG: 'brain_api.gateway_config'
} as const;

export type SiteSettingKey =
  (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];

/** Process-wide cache key for the runtime CORS config (write-through). */
export const RUNTIME_CORS_CACHE_KEY = 'brain-oauth:runtime-cors-config';

export const SITE_SETTINGS_SNAPSHOT_CACHE_KEY = 'brain-oauth:site-settings';

export const SITE_SETTING_DEFINITIONS: readonly SiteSettingDefinition<SiteSettingKey>[] =
  Object.freeze([
    {
      key: SITE_SETTING_KEYS.API_CORS_RULES,
      label: 'CORS 规则',
      description:
        '允许浏览器跨域调用 /oauth/token、/oauth/userinfo、/oauth/revoke 与登出接口的来源。每条规则填写来源 Origin、API 路径、HTTP 方法，均可选 *；路径支持 /oauth/*。留空时使用环境变量 API_CORS_ALLOWED_ORIGINS。',
      isSensitive: false,
      defaultValue: []
    },
    {
      key: SITE_SETTING_KEYS.BRAIN_API_GATEWAY_CONFIG,
      label: 'Brain API 配置',
      description:
        'Brain API 请求地址配置（JSON，对应 BrainUserGatewayConfig）：env、domains、userlyDomains、endpoints。domains 与 endpoints 会合并到默认值之上；留空使用默认（development）。',
      isSensitive: false,
      defaultValue: ''
    }
  ]);

export const siteSettingRegistry = new SiteSettingRegistry(
  SITE_SETTING_DEFINITIONS
);
