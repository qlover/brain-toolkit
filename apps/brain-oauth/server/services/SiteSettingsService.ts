import {
  MemoryKvCacheService,
  SiteSettingsService as KitSiteSettingsService,
  type SiteSettingsServiceConfig
} from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import {
  parseBrainApiSettings,
  resolveBrainApiTarget,
  serializeBrainApiSettings,
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

const BRAIN_API_TARGET_FRESH_MS = 60_000;

/**
 * Process-wide last known Brain API target. Login and `/api/brain/envs` read
 * it on every request, so a stale value is served while a refresh runs.
 */
let brainApiTargetCache: { target: BrainApiTarget; loadedAt: number } | null =
  null;
let brainApiTargetRefresh: Promise<BrainApiTarget> | null = null;
/** Bumped on invalidation so a refresh started earlier cannot re-cache old data. */
let brainApiTargetVersion = 0;

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
    const cached = brainApiTargetCache;
    if (cached && Date.now() - cached.loadedAt < BRAIN_API_TARGET_FRESH_MS) {
      return cached.target;
    }
    const refresh = this.refreshBrainApiTarget();
    if (!cached) {
      return refresh;
    }
    refresh.catch((error: unknown) => {
      this.logger.warn('Failed to refresh Brain API config', { error });
    });
    return cached.target;
  }

  /**
   * @override
   */
  public override async invalidateCache(): Promise<void> {
    brainApiTargetCache = null;
    brainApiTargetRefresh = null;
    brainApiTargetVersion += 1;
    await super.invalidateCache();
  }

  protected refreshBrainApiTarget(): Promise<BrainApiTarget> {
    if (brainApiTargetRefresh) {
      return brainApiTargetRefresh;
    }
    const version = brainApiTargetVersion;
    const refresh = this.loadBrainApiTarget()
      .then((target) => {
        if (version === brainApiTargetVersion) {
          brainApiTargetCache = { target, loadedAt: Date.now() };
        }
        return target;
      })
      .finally(() => {
        if (brainApiTargetRefresh === refresh) {
          brainApiTargetRefresh = null;
        }
      });
    brainApiTargetRefresh = refresh;
    return refresh;
  }

  /**
   * An invalid stored config falls back to package defaults so a bad setting
   * never breaks sign-in.
   */
  protected async loadBrainApiTarget(): Promise<BrainApiTarget> {
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
    return super.updateAdminSettings({
      settings: {
        ...patch.settings,
        [key]: serializeBrainApiSettings(parsed.settings)
      }
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
