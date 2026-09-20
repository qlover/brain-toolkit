import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import {
  getPamSiteSettingDefinition,
  PAM_DEFAULT_CORS_RULES,
  PAM_SITE_SETTING_DEFINITIONS,
  PAM_SITE_SETTING_KEYS,
  PAM_SITE_SETTING_SECRET_UNCHANGED,
  type PamCorsRule,
  type PamSiteSettingDefinition,
  type PamSiteSettingKey,
  type PamSiteSettingPrimitive
} from '@config/pamSiteSettings';
import type {
  PamAdminSiteSettingEntry,
  PamAdminSiteSettingsPatch,
  PamPublicConfig
} from '@schemas/PamSiteSettingsSchema';
import {
  isPamSiteSettingKey,
  parseCorsValue,
  safeParseCorsValue
} from '@schemas/PamSiteSettingsSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { SiteSettingsRepo } from '@server/repositorys/SiteSettingsRepo';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';
import { PAMEnvSecretEncryption } from '@server/utils/PAMEnvSecretEncryption';
import {
  buildPamSiteSettingSeedRows,
  resolvePamSiteSettingDefaultValue
} from '@server/utils/pamSiteSettingDefaults';
import {
  buildRuntimeCorsConfig,
  type RuntimeCorsConfig
} from '@server/utils/resolveRuntimeCorsConfig';
import type { LoggerInterface } from '@qlover/logger';

const CACHE_KEY = 'pam:site-settings:snapshot';
const CACHE_TTL_MS = 60_000;
/** CORS 运行时配置缓存键（无 TTL，写穿失效）。 */
export const PAM_RUNTIME_CORS_CACHE_KEY = 'pam:runtime-cors-config';

/** 旧版扁平 CORS 站点键（仅用于读库迁移）。 */
const LEGACY_CORS_ORIGINS_KEY = 'api.cors_origins';
const LEGACY_CORS_METHODS_KEY = 'api.cors_methods';

function parseCsvEnv(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type SnapshotType = {
  readonly values: ReadonlyMap<string, PamSiteSettingPrimitive>;
  readonly sources: ReadonlyMap<string, 'db' | 'default'>;
  readonly descriptions: ReadonlyMap<string, string>;
};

type CachedSnapshotType = {
  readonly values: Record<string, PamSiteSettingPrimitive>;
  readonly sources: Record<string, 'db' | 'default'>;
  readonly descriptions: Record<string, string>;
};

function toCachedSnapshot(snapshot: SnapshotType): CachedSnapshotType {
  return {
    values: Object.fromEntries(snapshot.values),
    sources: Object.fromEntries(snapshot.sources),
    descriptions: Object.fromEntries(snapshot.descriptions)
  };
}

function fromCachedSnapshot(cached: CachedSnapshotType): SnapshotType {
  return {
    values: new Map(Object.entries(cached.values)),
    sources: new Map(Object.entries(cached.sources)),
    descriptions: new Map(Object.entries(cached.descriptions ?? {}))
  };
}

function resolveSettingDescription(
  definition: PamSiteSettingDefinition,
  storedDesc?: string
): string {
  const trimmed = storedDesc?.trim();
  return trimmed || definition.description;
}

function resolveCodeDefault(
  definition: PamSiteSettingDefinition
): PamSiteSettingPrimitive {
  return resolvePamSiteSettingDefaultValue(definition);
}

@injectable()
export class SiteSettingsService {
  constructor(
    @inject(I.AppConfig)
    protected readonly serverConfig: SeedServerConfigInterface,
    @inject(SiteSettingsRepo)
    protected readonly repo: SiteSettingsRepo,
    @inject(MemoryKvCacheService)
    protected readonly cache: MemoryKvCacheService,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  protected getSecretEncryption(): PAMEnvSecretEncryption {
    return new PAMEnvSecretEncryption(this.serverConfig.pamEnvSecretKey);
  }

  public async invalidateCache(): Promise<void> {
    await this.cache.removeItem(CACHE_KEY);
    await this.cache.removeItem(PAM_RUNTIME_CORS_CACHE_KEY);
  }

  public async getBoolean(key: PamSiteSettingKey): Promise<boolean> {
    const value = await this.getValue(key);
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }
    return false;
  }

  public async getString(key: PamSiteSettingKey): Promise<string> {
    const value = await this.getValue(key);
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return '';
  }

  public async getStringArray(key: PamSiteSettingKey): Promise<string[]> {
    const value = await this.getValue(key);
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string' && value.trim()) {
      return parseCsvEnv(value);
    }
    return [];
  }

  public async getSecretString(key: PamSiteSettingKey): Promise<string> {
    const definition = getPamSiteSettingDefinition(key);
    if (!definition.isSensitive) {
      return this.getString(key);
    }

    const snapshot = await this.loadSnapshot();
    const stored = snapshot.values.get(key);
    if (typeof stored !== 'string' || !stored.trim()) {
      return '';
    }

    try {
      return this.getSecretEncryption().decrypt(stored);
    } catch (error) {
      this.logger.warn('Failed to decrypt site setting secret', { key, error });
      return '';
    }
  }

  public async getValue(
    key: PamSiteSettingKey
  ): Promise<PamSiteSettingPrimitive> {
    const definition = getPamSiteSettingDefinition(key);
    const snapshot = await this.loadSnapshot();
    const stored = snapshot.values.get(key);
    if (stored !== undefined) {
      return stored;
    }
    return resolveCodeDefault(definition);
  }

  public async getCorsConfig(): Promise<RuntimeCorsConfig> {
    return this.cache.getOrSet(PAM_RUNTIME_CORS_CACHE_KEY, () =>
      this.loadCorsConfigFromStore()
    );
  }

  protected resolveDefaultCorsMethods(): readonly string[] {
    return this.serverConfig.apiCorsAllowedMethods.length > 0
      ? this.serverConfig.apiCorsAllowedMethods
      : Object.freeze(['GET', 'POST', 'OPTIONS']);
  }

  protected async loadCorsConfigFromStore(): Promise<RuntimeCorsConfig> {
    const rulesRaw = await this.getValue(PAM_SITE_SETTING_KEYS.API_CORS_RULES);
    const apiCorsAllowedMethods = this.resolveDefaultCorsMethods();
    const parsedRules = this.normalizeCorsRules(rulesRaw);

    if (parsedRules.length > 0) {
      return buildRuntimeCorsConfig(parsedRules, apiCorsAllowedMethods);
    }

    const legacyRules = await this.loadLegacyCorsRulesFromRepo();
    if (legacyRules.length > 0) {
      return buildRuntimeCorsConfig(legacyRules, apiCorsAllowedMethods);
    }

    const envOrigins = this.serverConfig.apiCorsAllowedOrigins;
    const envRules: PamCorsRule[] = envOrigins.map((origin) => ({
      origin,
      path: '*',
      methods: ['*']
    }));

    return buildRuntimeCorsConfig(
      envRules.length > 0 ? envRules : [...PAM_DEFAULT_CORS_RULES],
      apiCorsAllowedMethods
    );
  }

  protected normalizeCorsRules(value: PamSiteSettingPrimitive): PamCorsRule[] {
    const parsed = safeParseCorsValue(value);
    if (parsed) {
      return parsed;
    }
    if (Array.isArray(value) && value.length > 0) {
      this.logger.warn('Invalid api.cors_rules in store; falling back', {
        sample: value[0]
      });
    }
    return [];
  }

  /**
   * 兼容旧 `api.cors_origins` / `api.cors_methods` 行（定义已移除后仍可能残留在 DB）。
   */
  protected async loadLegacyCorsRulesFromRepo(): Promise<PamCorsRule[]> {
    const rows = await this.repo.getAll();
    const originsRow = rows.find((row) => row.key === LEGACY_CORS_ORIGINS_KEY);
    if (!originsRow) {
      return [];
    }

    const origins = this.coerceStringArray(originsRow.value);
    if (origins.length === 0) {
      return [];
    }

    const methodsRow = rows.find((row) => row.key === LEGACY_CORS_METHODS_KEY);
    const methods = this.coerceStringArray(methodsRow?.value);
    const ruleMethods =
      methods.length > 0 ? methods.map((m) => m.toUpperCase()) : ['*'];

    return origins.map((origin) => ({
      origin,
      path: '*',
      methods: ruleMethods
    }));
  }

  protected coerceStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return parseCsvEnv(value);
    }
    return [];
  }

  public async getPublicConfig(): Promise<PamPublicConfig> {
    const [
      phoneLoginEnabled,
      phoneOtpProviderRaw,
      googleOauthEnabled,
      brainPkceEnabled,
      brainSupabaseEnabled
    ] = await Promise.all([
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_PHONE_LOGIN_ENABLED),
      this.getString(PAM_SITE_SETTING_KEYS.AUTH_PHONE_OTP_PROVIDER),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_GOOGLE_OAUTH_ENABLED),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED),
      this.getBoolean(PAM_SITE_SETTING_KEYS.AUTH_BRAIN_SUPABASE_ENABLED)
    ]);

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
        brainSupabaseEnabled
      }
    };
  }

  public async getAdminSettings(): Promise<PamAdminSiteSettingEntry[]> {
    const snapshot = await this.loadSnapshot();
    return PAM_SITE_SETTING_DEFINITIONS.map((definition) => {
      const stored = snapshot.values.get(definition.key);
      const source = snapshot.sources.get(definition.key) ?? 'default';

      if (definition.isSensitive) {
        const configured =
          source === 'db' &&
          typeof stored === 'string' &&
          stored.trim().length > 0;
        return {
          key: definition.key,
          label: definition.label,
          description: resolveSettingDescription(
            definition,
            snapshot.descriptions.get(definition.key)
          ),
          value: configured ? PAM_SITE_SETTING_SECRET_UNCHANGED : '',
          configured,
          isSensitive: true,
          source
        };
      }

      const value = stored ?? resolveCodeDefault(definition);

      return {
        key: definition.key,
        label: definition.label,
        description: resolveSettingDescription(
          definition,
          snapshot.descriptions.get(definition.key)
        ),
        value,
        configured: source === 'db',
        isSensitive: false,
        source
      };
    });
  }

  public async updateAdminSettings(
    patch: PamAdminSiteSettingsPatch
  ): Promise<PamAdminSiteSettingEntry[]> {
    const rows: {
      key: string;
      value: unknown;
      description: string;
      isSensitive: boolean;
    }[] = [];
    let corsRulesForCache: PamCorsRule[] | undefined;

    for (const [rawKey, rawValue] of Object.entries(patch.settings)) {
      if (!isPamSiteSettingKey(rawKey)) {
        continue;
      }

      const definition = getPamSiteSettingDefinition(rawKey);

      if (definition.isSensitive) {
        if (
          typeof rawValue !== 'string' ||
          !rawValue.trim() ||
          rawValue === PAM_SITE_SETTING_SECRET_UNCHANGED
        ) {
          continue;
        }
        rows.push({
          key: rawKey,
          value: this.getSecretEncryption().encrypt(rawValue.trim()),
          description: definition.description,
          isSensitive: true
        });
        continue;
      }

      if (rawKey === PAM_SITE_SETTING_KEYS.API_CORS_RULES) {
        const parsed = parseCorsValue(rawValue);
        rows.push({
          key: rawKey,
          value: parsed,
          description: definition.description,
          isSensitive: false
        });
        corsRulesForCache = parsed;
        continue;
      }

      rows.push({
        key: rawKey,
        value: rawValue,
        description: definition.description,
        isSensitive: false
      });
    }

    await this.repo.upsertMany(rows);
    await this.invalidateCache();

    if (corsRulesForCache) {
      await this.cache.setItem(
        PAM_RUNTIME_CORS_CACHE_KEY,
        buildRuntimeCorsConfig(
          corsRulesForCache,
          this.resolveDefaultCorsMethods()
        )
      );
    }

    return this.getAdminSettings();
  }

  protected async ensureSeeded(
    existingKeys: ReadonlySet<string>
  ): Promise<void> {
    const missing = buildPamSiteSettingSeedRows().filter(
      (row) => !existingKeys.has(row.key)
    );
    if (missing.length === 0) {
      return;
    }
    await this.repo.upsertMany(missing);
  }

  protected async loadSnapshot(): Promise<SnapshotType> {
    const cached = await this.cache.getItem<CachedSnapshotType>(CACHE_KEY);
    if (cached) {
      return fromCachedSnapshot(cached);
    }

    let rows = await this.repo.getAll();
    if (rows.length < PAM_SITE_SETTING_DEFINITIONS.length) {
      await this.ensureSeeded(new Set(rows.map((row) => row.key)));
      rows = await this.repo.getAll();
    }

    const values = new Map<string, PamSiteSettingPrimitive>();
    const sources = new Map<string, 'db' | 'default'>();
    const descriptions = new Map<string, string>();

    for (const row of rows) {
      if (!isPamSiteSettingKey(row.key)) {
        continue;
      }
      const definition = getPamSiteSettingDefinition(row.key);
      if (definition.isSensitive) {
        values.set(row.key, String(row.value ?? ''));
      } else {
        values.set(row.key, row.value as PamSiteSettingPrimitive);
      }
      sources.set(row.key, 'db');
      if (row.description?.trim()) {
        descriptions.set(row.key, row.description.trim());
      }
    }

    for (const definition of PAM_SITE_SETTING_DEFINITIONS) {
      if (values.has(definition.key)) {
        continue;
      }
      values.set(definition.key, resolveCodeDefault(definition));
      sources.set(definition.key, 'default');
    }

    const snapshot: SnapshotType = {
      values,
      sources,
      descriptions
    };

    await this.cache.setItem(CACHE_KEY, toCachedSnapshot(snapshot), {
      ttlMs: CACHE_TTL_MS
    });
    return snapshot;
  }
}
