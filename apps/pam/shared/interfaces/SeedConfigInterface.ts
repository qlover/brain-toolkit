import type { SeedConfigInterface } from '@qlover/corekit-bridge/bootstrap';
import type { StringValue } from 'ms';

export interface SharedConfigInterface extends SeedConfigInterface {
  // 需要扩展前后端通用配置
}

export interface SeedServerConfigInterface extends SharedConfigInterface {
  readonly siteUrl: string;
  readonly logPrefixTemplate: string;
  readonly userTokenKey: string;
  readonly jwtSecret: string;
  readonly appHost: string;
  readonly stringEncryptorKey: string;

  /**
   * login user token expires in
   *
   * @example '30 days'
   * @example '1 year'
   */
  readonly jwtExpiresIn: StringValue;

  readonly openaiBaseUrl: string;
  readonly openaiApiKey: string;

  /** HttpOnly OAuth session cookie signing secret. */
  readonly sessionSecret: string;
  /** AES-256-GCM key for encrypted provider tokens in DB. */
  readonly encryptionKey: string;

  /** AES-256-GCM key for sensitive PAM environment variable values at rest. */
  readonly pamEnvSecretKey: string;

  /** Allowed CORS origins from `API_CORS_ALLOWED_ORIGINS`; empty disables CORS. */
  readonly apiCorsAllowedOrigins: readonly string[];

  /** Allowed CORS methods from `API_CORS_ALLOWED_METHODS`. */
  readonly apiCorsAllowedMethods: readonly string[];

  /** OAuth session key. */
  readonly oauthSessionKey: string;

  /**
   * PAM CLI bearer JWT lifetime (revocable via jti; re-login when expired).
   *
   * @example '30d'
   * @example '21d'
   */
  readonly pamCliTokenExpiresIn: StringValue;

  /** Brain OAuth AS base URL (e.g. http://localhost:3122). Empty = Brain PKCE login disabled. */
  readonly brainOAuthSiteUrl: string;
  /** OAuth client_id registered on Brain OAuth. */
  readonly brainOAuthClientId: string;
  /** Optional client_secret for confidential clients; public PKCE clients leave empty. */
  readonly brainOAuthClientSecret: string;
  /** Exact redirect_uri registered on Brain OAuth; empty = `{SITE_URL}/api/callback/brain-oauth`. */
  readonly brainOAuthRedirectUri: string;
  /** Space-separated scopes; default `openid profile email`. */
  readonly brainOAuthScopes: string;
  /** Optional fixed authorize locale (`en`|`zh`); empty uses request locale. */
  readonly brainOAuthLocale: string;
}
export interface SeedSrcConfigInterface extends SharedConfigInterface {
  readonly stringEncryptorKey: string;

  readonly testLoginEmail: string;
  readonly testLoginPassword: string;

  /**
   * PAM 状态持久化key 名字
   */
  readonly pamStorageKey: string;
}
