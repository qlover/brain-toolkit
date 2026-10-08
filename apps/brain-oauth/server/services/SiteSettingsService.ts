import {
  MemoryKvCacheService,
  SiteSettingsService as KitSiteSettingsService,
  type SiteSettingsServiceConfig
} from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import {
  BRAIN_API_CUSTOM_ENV,
  isBrainApiEnv,
  isValidBrainApiBaseUrl,
  normalizeBrainApiBaseUrl,
  resolveBrainApiTarget,
  type BrainApiTarget
} from '@config/brainApi';
import { I } from '@config/ioc-identifiter';
import {
  RUNTIME_CORS_CACHE_KEY,
  SITE_SETTING_KEYS,
  SITE_SETTINGS_SNAPSHOT_CACHE_KEY,
  siteSettingRegistry,
  type SiteSettingKey
} from '@config/siteSettings';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { SiteSettingsRepo } from '@server/repositorys/SiteSettingsRepo';
import type {
  AdminSiteSettingEntry,
  AdminSiteSettingsPatch
} from '@brain-toolkit/next-app-kit/shared';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class SiteSettingsService extends KitSiteSettingsService<SiteSettingKey> {
  constructor(
    @inject(I.AppConfig)
    protected readonly serverConfig: SeedServerConfigInterface,
    @inject(SiteSettingsRepo) repo: SiteSettingsRepo,
    @inject(MemoryKvCacheService) cache: MemoryKvCacheService,
    @inject(I.Logger) logger: LoggerInterface
  ) {
    super(repo, cache, logger);
  }

  public async getBrainApiTarget(): Promise<BrainApiTarget> {
    const [env, baseUrl] = await Promise.all([
      this.getString(SITE_SETTING_KEYS.BRAIN_API_ENV),
      this.getString(SITE_SETTING_KEYS.BRAIN_API_BASE_URL)
    ]);
    const target = resolveBrainApiTarget(env, baseUrl);
    if (env.trim() && target.env !== env.trim()) {
      this.logger.warn('Invalid Brain API setting; using default env', {
        env,
        baseUrl
      });
    }
    return target;
  }

  /**
   * @override
   */
  public override async updateAdminSettings(
    patch: AdminSiteSettingsPatch
  ): Promise<AdminSiteSettingEntry<SiteSettingKey>[]> {
    const current = await this.getAdminSettings();
    const valueOf = (key: SiteSettingKey): unknown =>
      key in patch.settings
        ? patch.settings[key]
        : current.find((entry) => entry.key === key)?.value;

    const env = valueOf(SITE_SETTING_KEYS.BRAIN_API_ENV);
    const baseUrl = valueOf(SITE_SETTING_KEYS.BRAIN_API_BASE_URL);
    if (typeof env !== 'string' || !isBrainApiEnv(env)) {
      throw new Error(`Invalid Brain API env: ${String(env)}`);
    }
    if (typeof baseUrl !== 'string') {
      throw new Error('Invalid Brain API base URL');
    }
    if (env === BRAIN_API_CUSTOM_ENV && !isValidBrainApiBaseUrl(baseUrl)) {
      throw new Error('Brain API base URL must be an http(s) URL');
    }

    const settings = { ...patch.settings };
    if (SITE_SETTING_KEYS.BRAIN_API_BASE_URL in settings) {
      settings[SITE_SETTING_KEYS.BRAIN_API_BASE_URL] = baseUrl.trim()
        ? normalizeBrainApiBaseUrl(baseUrl)
        : '';
    }
    return super.updateAdminSettings({ settings });
  }

  /**
   * @override
   */
  protected get config(): SiteSettingsServiceConfig<SiteSettingKey> {
    return {
      registry: siteSettingRegistry,
      snapshotCacheKey: SITE_SETTINGS_SNAPSHOT_CACHE_KEY,
      corsCacheKey: RUNTIME_CORS_CACHE_KEY,
      corsRulesKey: SITE_SETTING_KEYS.API_CORS_RULES,
      defaultCorsRules: [],
      envCorsOrigins: this.serverConfig.apiCorsAllowedOrigins,
      envCorsMethods: this.serverConfig.apiCorsAllowedMethods
    };
  }
}
