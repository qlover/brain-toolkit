import {
  MemoryKvCacheService,
  SiteSettingsService as KitSiteSettingsService,
  type SiteSettingSecretCipher,
  type SiteSettingsServiceConfig
} from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import {
  PAM_DEFAULT_CORS_RULES,
  PAM_SITE_SETTING_KEYS,
  pamSiteSettingRegistry,
  type PamCorsRule,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';
import type { PamPublicConfig } from '@schemas/PamSiteSettingsSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { SiteSettingsRepo } from '@server/repositorys/SiteSettingsRepo';
import { PAMEnvSecretEncryption } from '@server/utils/PAMEnvSecretEncryption';
import type { LoggerInterface } from '@qlover/logger';

/** CORS 运行时配置缓存键（无 TTL，写穿失效）。 */
export const PAM_RUNTIME_CORS_CACHE_KEY = 'pam:runtime-cors-config';

/** 旧版扁平 CORS 站点键（仅用于读库迁移）。 */
const LEGACY_CORS_ORIGINS_KEY = 'api.cors_origins';
const LEGACY_CORS_METHODS_KEY = 'api.cors_methods';

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

@injectable()
export class SiteSettingsService extends KitSiteSettingsService<PamSiteSettingKey> {
  constructor(
    @inject(I.AppConfig)
    protected readonly serverConfig: SeedServerConfigInterface,
    @inject(SiteSettingsRepo) repo: SiteSettingsRepo,
    @inject(MemoryKvCacheService) cache: MemoryKvCacheService,
    @inject(I.Logger) logger: LoggerInterface
  ) {
    super(repo, cache, logger);
  }

  /**
   * @override
   */
  protected get config(): SiteSettingsServiceConfig<PamSiteSettingKey> {
    return {
      registry: pamSiteSettingRegistry,
      snapshotCacheKey: 'pam:site-settings:snapshot',
      corsCacheKey: PAM_RUNTIME_CORS_CACHE_KEY,
      corsRulesKey: PAM_SITE_SETTING_KEYS.API_CORS_RULES,
      defaultCorsRules: PAM_DEFAULT_CORS_RULES,
      envCorsOrigins: this.serverConfig.apiCorsAllowedOrigins,
      envCorsMethods: this.serverConfig.apiCorsAllowedMethods
    };
  }

  /**
   * @override
   */
  protected getSecretCipher(): SiteSettingSecretCipher {
    return new PAMEnvSecretEncryption(this.serverConfig.pamEnvSecretKey);
  }

  /**
   * 兼容旧 `api.cors_origins` / `api.cors_methods` 行（定义已移除后仍可能残留在 DB）。
   *
   * @override
   */
  protected async loadFallbackCorsRules(): Promise<PamCorsRule[]> {
    const rows = await this.repo.getAll();
    const originsRow = rows.find((row) => row.key === LEGACY_CORS_ORIGINS_KEY);
    const origins = coerceStringArray(originsRow?.value);
    if (origins.length === 0) {
      return [];
    }

    const methodsRow = rows.find((row) => row.key === LEGACY_CORS_METHODS_KEY);
    const methods = coerceStringArray(methodsRow?.value);
    const ruleMethods =
      methods.length > 0 ? methods.map((m) => m.toUpperCase()) : ['*'];

    return origins.map((origin) => ({
      origin,
      path: '*',
      methods: ruleMethods
    }));
  }

  public async getPublicConfig(): Promise<PamPublicConfig> {
    const [
      phoneLoginEnabled,
      phoneOtpProviderRaw,
      googleOauthEnabled,
      brainPkceEnabled,
      brainSupabaseEnabled,
      passwordResetSwitch,
      mailProviderRaw
    ] = await Promise.all([
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_PHONE_LOGIN_ENABLED),
      this.getString(PAM_SITE_SETTING_KEYS.AUTH_PHONE_OTP_PROVIDER),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_GOOGLE_OAUTH_ENABLED),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_BRAIN_SUPABASE_ENABLED),
      this.getBoolean(PAM_SITE_SETTING_KEYS.MAIL_PASSWORD_RESET_ENABLED),
      this.getString(PAM_SITE_SETTING_KEYS.MAIL_PROVIDER)
    ]);

    const mailProvider = mailProviderRaw.trim().toLowerCase();
    const passwordResetEnabled =
      passwordResetSwitch && mailProvider !== '' && mailProvider !== 'disabled';

    const phoneOtpProvider =
      phoneOtpProviderRaw.trim().toLowerCase() === 'aliyun'
        ? ('aliyun' as const)
        : ('memory' as const);

    return {
      auth: {
        phoneLoginEnabled,
        phoneOtpProvider,
        googleOauthEnabled,
        brainPkceEnabled,
        brainSupabaseEnabled,
        passwordResetEnabled
      }
    };
  }
}
