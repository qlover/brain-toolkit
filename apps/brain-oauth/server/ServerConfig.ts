import { CompositeEnvSource } from '@shared/env/CompositeEnvSource';
import { ProcessEnvSource } from '@shared/env/ProcessEnvSource';
import { runtimeEnvBridge } from '@shared/env/RuntimeEnvBridge';
import { logPrefixTemplate } from '@config/common';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { name, version } from '../package.json';
import type { EnvSourceInterface } from '@pamenv/next';
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
 * 生产构建/起服禁止落回测试默认密钥；本地 `next dev` 仍可走 FIXME 兜底。
 */
function isStrictServerSecretEnv(env: EnvSourceInterface): boolean {
  return env.get('NODE_ENV') === 'production' || env.get('VERCEL') === '1';
}

function requireOrDevFallback(
  env: EnvSourceInterface,
  envName: string,
  value: string | undefined,
  devFallback: string
): string {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (isStrictServerSecretEnv(env)) {
    throw new Error(
      `${envName} is required (missing after pamenv bag / platform env)`
    );
  }
  return devFallback;
}

/**
 * 服务端配置：凡来自环境的项均经 {@link EnvSourceInterface} 懒读。
 *
 * 默认源是 `process.env`（本地进程级插件已写入）。
 * 运行时解封后调用 {@link bindPamenvBag}，袋优先、平台键回落 process。
 *
 * `APP_ENV` 仍表示应用态；`PAM_ENV` 仅表示从 PAM 拉哪套变量。
 */
export class ServerConfig implements SeedServerConfigInterface {
  public readonly name: string = name;
  public readonly version: string = version;

  protected envSource: EnvSourceInterface;

  /**
   * @param envSource - 环境源；省略则用 {@link runtimeEnvBridge}
   *（入口 bind 后与请求袋同源，避免 `new ServerConfig()` 漏袋）
   */
  public constructor(envSource: EnvSourceInterface = runtimeEnvBridge) {
    this.envSource = envSource;
  }

  /**
   * 挂上运行时解封袋：PAM 键走袋，平台键仍回落 `process.env`；
   * 同步 {@link runtimeEnvBridge}，供尚不能注入 config 的模块同源读取。
   */
  public bindPamenvBag(bag: EnvSourceInterface): void {
    this.envSource = new CompositeEnvSource(bag, ProcessEnvSource.INSTANCE);
    runtimeEnvBridge.bind(this.envSource);
  }

  /**
   * @override
   */
  public get siteUrl(): string {
    return this.envSource.get('SITE_URL') ?? '';
  }

  /**
   * @override
   */
  public get appHost(): string {
    return this.siteUrl;
  }

  /**
   * 应用态（`APP_ENV`），与 PAM 环境名正交。
   *
   * @override
   */
  public get env(): string {
    return this.envSource.get('APP_ENV') ?? 'development';
  }

  /**
   * @override
   */
  public get isProduction(): boolean {
    return this.envSource.get('APP_ENV') === 'production';
  }

  /**
   * @override
   */
  public get logLevel(): string {
    return (
      this.envSource.get('NEXT_PUBLIC_LOG_LEVEL') ??
      this.envSource.get('LOG_LEVEL') ??
      'info'
    );
  }

  /**
   * @override
   */
  public get userTokenKey(): string {
    return this.envSource.get('NEXT_PUBLIC_USER_TOKEN_KEY') ?? '';
  }

  /**
   * @override
   */
  public get jwtSecret(): string {
    return this.envSource.get('JWT_SECRET') ?? '';
  }

  /**
   * login user token expires in
   *
   * @example '30 days'
   * @example '1 year'
   */
  public readonly jwtExpiresIn: StringValue = '30 days';

  /**
   * @override
   */
  public get openaiBaseUrl(): string {
    return (
      this.envSource.get('OPENAI_BASE_URL') ??
      this.envSource.get('CEREBRAS_BASE_URL') ??
      ''
    );
  }

  /**
   * @override
   */
  public get openaiApiKey(): string {
    return (
      this.envSource.get('OPENAI_API_KEY') ??
      this.envSource.get('CEREBRAS_API_KEY') ??
      ''
    );
  }

  /**
   * @override
   */
  public get stringEncryptorKey(): string {
    return this.envSource.get('NEXT_PUBLIC_STRING_ENCRYPT_KEY') ?? '';
  }

  /**
   * @override
   */
  public get sessionSecret(): string {
    return requireOrDevFallback(
      this.envSource,
      'SESSION_SECRET',
      this.envSource.get('SESSION_SECRET'),
      // FIXME: 仅本地/测试兜底；Vercel 与 production 缺值直接抛错
      'testabcdtest5fccf34d41ddaaea88eaea9c35d705b581524a586c11d444945e'
    );
  }

  /**
   * @override
   */
  public get encryptionKey(): string {
    return requireOrDevFallback(
      this.envSource,
      'ENCRYPTION_KEY',
      this.envSource.get('ENCRYPTION_KEY'),
      // FIXME: 仅本地/测试兜底；Vercel 与 production 缺值直接抛错
      'base64:ZrNkJ4d7VfrLZPP0/ksjINC5XIRKmrIr1bPd+l+Wi7o='
    );
  }

  /**
   * @override
   */
  public get apiCorsAllowedOrigins(): readonly string[] {
    return parseCsvEnv(this.envSource.get('API_CORS_ALLOWED_ORIGINS'));
  }

  /**
   * @override
   */
  public get apiCorsAllowedMethods(): readonly string[] {
    return parseCsvEnv(
      this.envSource.get('API_CORS_ALLOWED_METHODS'),
      'GET,POST,OPTIONS'
    );
  }

  /**
   * @override
   */
  public get brainAdminEnvs(): readonly string[] {
    return parseCsvEnv(this.envSource.get('BRAIN_ADMIN_ENVS'));
  }

  /**
   * @override
   */
  public get logPrefixTemplate(): string {
    return this.envSource.get('LOG_PREFIX_TEMPLATE') ?? logPrefixTemplate;
  }

  /**
   * @override
   */
  public get oauthSessionKey(): string {
    return (
      this.envSource.get('OAUTH_SESSION_KEY') ?? 'brain_oauth_wrapper_session'
    );
  }
}
