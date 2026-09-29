import {
  MemoryKvCacheService,
  SiteSettingsService as KitSiteSettingsService,
  type SiteSettingsServiceConfig
} from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
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
