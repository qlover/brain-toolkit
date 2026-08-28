import { logPrefixTemplate } from '@config/common';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { name, version } from '../package.json';
import type { StringValue } from 'ms';

function parseCsvEnv(
  value: string | undefined,
  fallback?: string
): readonly string[] {
  const raw = value?.trim() ? value : fallback;
  if (!raw?.trim()) {
    return [];
  }
  return Object.freeze(
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

/**
 * Require `SITE_URL` and normalize it to always end with `/`.
 */
function requireSiteUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('SITE_URL must be a non-empty string');
  }
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export class ServerConfig implements SeedServerConfigInterface {
  public readonly siteUrl: string = requireSiteUrl(process.env.SITE_URL);
  public readonly appHost: string = this.siteUrl;
  public readonly env: string = process.env.APP_ENV ?? 'development';
  public readonly name: string = name;
  public readonly version: string = version;
  public readonly isProduction: boolean = process.env.APP_ENV === 'production';
  public readonly logLevel: string =
    process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL ?? 'info';

  public readonly userTokenKey: string =
    process.env.NEXT_PUBLIC_USER_TOKEN_KEY ?? '';

  public readonly jwtSecret: string = process.env.JWT_SECRET ?? '';
  /**
   * login user token expires in
   *
   * @example '30 days'
   * @example '1 year'
   */
  public readonly jwtExpiresIn: StringValue = '30 days';

  public readonly openaiBaseUrl: string = process.env.CEREBRAS_BASE_URL ?? '';
  public readonly openaiApiKey: string = process.env.CEREBRAS_API_KEY ?? '';
  public readonly stringEncryptorKey: string =
    process.env.NEXT_PUBLIC_STRING_ENCRYPT_KEY ?? '';

  public readonly sessionSecret: string =
    process.env.SESSION_SECRET ??
    // FIXME: 下面仅用于测试，真实开发需要去掉
    'testabcdtest5fccf34d41ddaaea88eaea9c35d705b581524a586c11d444945e';

  public readonly encryptionKey: string =
    process.env.ENCRYPTION_KEY ??
    // FIXME: 下面仅用于测试，真实开发需要去掉
    'base64:ZrNkJ4d7VfrLZPP0/ksjINC5XIRKmrIr1bPd+l+Wi7o=';

  public readonly pamEnvSecretKey: string =
    process.env.PAM_ENV_SECRET_KEY ??
    // FIXME: 下面仅用于测试，真实开发需要去掉
    'base64:ZrNkJ4d7VfrLZPP0/ksjINC5XIRKmrIr1bPd+l+Wi7o=';

  public readonly apiCorsAllowedOrigins: readonly string[] = parseCsvEnv(
    process.env.API_CORS_ALLOWED_ORIGINS
  );

  public readonly apiCorsAllowedMethods: readonly string[] = parseCsvEnv(
    process.env.API_CORS_ALLOWED_METHODS,
    'GET,POST,OPTIONS'
  );

  public readonly logPrefixTemplate: string =
    process.env.LOG_PREFIX_TEMPLATE ?? logPrefixTemplate;

  public readonly oauthSessionKey: string =
    process.env.OAUTH_SESSION_KEY ?? 'pam_session';

  /**
   * CLI bearer TTL. Override with `PAM_CLI_TOKEN_EXPIRES_IN` (e.g. `21d`).
   */
  public readonly pamCliTokenExpiresIn: StringValue = (process.env
    .PAM_CLI_TOKEN_EXPIRES_IN ?? '30d') as StringValue;

  public readonly brainOAuthSiteUrl: string = (
    process.env.BRAIN_OAUTH_SITE_URL ?? ''
  )
    .trim()
    .replace(/\/+$/, '');

  public readonly brainOAuthClientId: string = (
    process.env.BRAIN_OAUTH_CLIENT_ID ?? ''
  ).trim();

  public readonly brainOAuthClientSecret: string = (
    process.env.BRAIN_OAUTH_CLIENT_SECRET ?? ''
  ).trim();

  public readonly brainOAuthRedirectUri: string = (
    process.env.BRAIN_OAUTH_REDIRECT_URI ?? ''
  ).trim();

  public readonly brainOAuthScopes: string =
    (process.env.BRAIN_OAUTH_SCOPES ?? '').trim() || 'openid profile email';

  public readonly brainOAuthLocale: string = (
    process.env.BRAIN_OAUTH_LOCALE ?? ''
  ).trim();

  /**
   * Screenshot capture template. Use `{url}` for the target page.
   * Empty → Microlink API.
   */
  public readonly pamScreenshotUrlTemplate: string = (
    process.env.PAM_SCREENSHOT_URL_TEMPLATE ?? ''
  ).trim();

  public readonly pamPreviewBucket: string =
    (process.env.PAM_PREVIEW_BUCKET ?? '').trim() || 'pam-previews';
}
