import {
  MemoryKvCacheService,
  SiteSettingsService as KitSiteSettingsService,
  type SiteSettingsServiceConfig
} from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import {
  parseBrainApiSettings,
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

  /**
   * An invalid stored config falls back to package defaults so a bad setting
   * never breaks sign-in.
   */
  public async getBrainApiTarget(): Promise<BrainApiTarget> {
    const raw = await this.getString(
      SITE_SETTING_KEYS.BRAIN_API_GATEWAY_CONFIG
    );
    const parsed = parseBrainApiSettings(raw);
    if (!parsed.success) {
      this.logger.warn('Invalid Brain API config; using defaults', {
        error: parsed.error
      });
      return resolveBrainApiTarget({});
    }
    return resolveBrainApiTarget(parsed.settings);
  }

  /**
   * @override
   */
  public override async updateAdminSettings(
    patch: AdminSiteSettingsPatch
  ): Promise<AdminSiteSettingEntry<SiteSettingKey>[]> {
    const key = SITE_SETTING_KEYS.BRAIN_API_GATEWAY_CONFIG;
    if (!(key in patch.settings)) {
      return super.updateAdminSettings(patch);
    }

    const raw = patch.settings[key];
    if (typeof raw !== 'string') {
      throw new Error('Brain API config must be a JSON string');
    }
    const parsed = parseBrainApiSettings(raw);
    if (!parsed.success) {
      throw new Error(`Invalid Brain API config: ${parsed.error}`);
    }
    const normalized =
      Object.keys(parsed.settings).length > 0
        ? JSON.stringify(parsed.settings, null, 2)
        : '';
    return super.updateAdminSettings({
      settings: { ...patch.settings, [key]: normalized }
    });
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
