import {
  parseCorsValue,
  resolveSiteSettingDefaultValue,
  safeParseCorsValue,
  SITE_SETTING_SECRET_UNCHANGED,
  type AdminSiteSettingEntry,
  type AdminSiteSettingsPatch,
  type CorsRule,
  type SiteSettingPrimitive,
  type SiteSettingRegistry,
  type SiteSettingUpsertInput
} from '../../shared/siteSettings';
import {
  buildRuntimeCorsConfig,
  DEFAULT_CORS_METHODS,
  envCorsRules,
  type RuntimeCorsConfig
} from './runtimeCors';
import type { MemoryKvCacheService } from '../services/MemoryKvCacheService';
import type { SiteSettingsRepository } from './SiteSettingsRepository';

export interface SiteSettingsServiceConfig<K extends string> {
  readonly registry: SiteSettingRegistry<K>;
  /** Process-wide cache key for the settings snapshot. */
  readonly snapshotCacheKey: string;
  readonly snapshotTtlMs?: number;
  /** Process-wide cache key for {@link RuntimeCorsConfig} (write-through). */
  readonly corsCacheKey: string;
  /** Setting that stores the CORS rule list; omit when the app has none. */
  readonly corsRulesKey?: K;
  /** Used when neither DB nor env provides rules. */
  readonly defaultCorsRules: readonly CorsRule[];
  /** `API_CORS_ALLOWED_ORIGINS` fallback. */
  readonly envCorsOrigins: readonly string[];
  /** `API_CORS_ALLOWED_METHODS` fallback. */
  readonly envCorsMethods: readonly string[];
}

export interface SiteSettingSecretCipher {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export interface SiteSettingsLogger {
  warn(...args: unknown[]): void;
}

type Snapshot = {
  readonly values: ReadonlyMap<string, SiteSettingPrimitive>;
  readonly sources: ReadonlyMap<string, 'db' | 'default'>;
  readonly descriptions: ReadonlyMap<string, string>;
};

type CachedSnapshot = {
  readonly values: Record<string, SiteSettingPrimitive>;
  readonly sources: Record<string, 'db' | 'default'>;
  readonly descriptions: Record<string, string>;
};

const DEFAULT_SNAPSHOT_TTL_MS = 60_000;

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * DB-backed site settings with code defaults, secrets, cache and runtime
 * CORS config. Apps provide {@link config} and optionally a secret cipher.
 */
export abstract class SiteSettingsService<K extends string> {
  protected abstract get config(): SiteSettingsServiceConfig<K>;

  constructor(
    protected readonly repo: SiteSettingsRepository,
    protected readonly cache: MemoryKvCacheService,
    protected readonly logger: SiteSettingsLogger
  ) {}

  /** Required when any definition is sensitive. */
  protected getSecretCipher(): SiteSettingSecretCipher | null {
    return null;
  }

  protected requireSecretCipher(): SiteSettingSecretCipher {
    const cipher = this.getSecretCipher();
    if (!cipher) {
      throw new Error('Sensitive site settings require a secret cipher');
    }
    return cipher;
  }

  public async invalidateCache(): Promise<void> {
    await this.cache.removeItem(this.config.snapshotCacheKey);
    await this.cache.removeItem(this.config.corsCacheKey);
  }

  public async getBoolean(key: K): Promise<boolean> {
    const value = await this.getValue(key);
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }
    return false;
  }

  public async getString(key: K): Promise<string> {
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

  public async getStringArray(key: K): Promise<string[]> {
    const value = await this.getValue(key);
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string' && value.trim()) {
      return parseCsv(value);
    }
    return [];
  }

  public async getSecretString(key: K): Promise<string> {
    const definition = this.config.registry.get(key);
    if (!definition.isSensitive) {
      return this.getString(key);
    }

    const snapshot = await this.loadSnapshot();
    const stored = snapshot.values.get(key);
    if (typeof stored !== 'string' || !stored.trim()) {
      return '';
    }

    try {
      return this.requireSecretCipher().decrypt(stored);
    } catch (error) {
      this.logger.warn('Failed to decrypt site setting secret', { key, error });
      return '';
    }
  }

  public async getValue(key: K): Promise<SiteSettingPrimitive> {
    const definition = this.config.registry.get(key);
    const snapshot = await this.loadSnapshot();
    const stored = snapshot.values.get(key);
    if (stored !== undefined) {
      return stored;
    }
    return resolveSiteSettingDefaultValue(definition);
  }

  public async getCorsConfig(): Promise<RuntimeCorsConfig> {
    return this.cache.getOrSet(this.config.corsCacheKey, () =>
      this.loadCorsConfigFromStore()
    );
  }

  protected resolveDefaultCorsMethods(): readonly string[] {
    return this.config.envCorsMethods.length > 0
      ? this.config.envCorsMethods
      : DEFAULT_CORS_METHODS;
  }

  /** Extra source between DB rules and env (e.g. legacy keys). */
  protected async loadFallbackCorsRules(): Promise<CorsRule[]> {
    return [];
  }

  protected async loadCorsConfigFromStore(): Promise<RuntimeCorsConfig> {
    const methods = this.resolveDefaultCorsMethods();
    const { corsRulesKey } = this.config;

    if (corsRulesKey) {
      const rules = this.normalizeCorsRules(await this.getValue(corsRulesKey));
      if (rules.length > 0) {
        return buildRuntimeCorsConfig(rules, methods);
      }
    }

    const fallbackRules = await this.loadFallbackCorsRules();
    if (fallbackRules.length > 0) {
      return buildRuntimeCorsConfig(fallbackRules, methods);
    }

    const envRules = envCorsRules(this.config.envCorsOrigins);
    return buildRuntimeCorsConfig(
      envRules.length > 0 ? envRules : [...this.config.defaultCorsRules],
      methods
    );
  }

  protected normalizeCorsRules(value: SiteSettingPrimitive): CorsRule[] {
    const parsed = safeParseCorsValue(value);
    if (parsed) {
      return parsed;
    }
    if (Array.isArray(value) && value.length > 0) {
      this.logger.warn('Invalid CORS rules in store; falling back', {
        sample: value[0]
      });
    }
    return [];
  }

  public async getAdminSettings(): Promise<AdminSiteSettingEntry<K>[]> {
    const snapshot = await this.loadSnapshot();
    return this.config.registry.definitions.map((definition) => {
      const stored = snapshot.values.get(definition.key);
      const source = snapshot.sources.get(definition.key) ?? 'default';
      const description =
        snapshot.descriptions.get(definition.key) || definition.description;

      if (definition.isSensitive) {
        const configured =
          source === 'db' &&
          typeof stored === 'string' &&
          stored.trim().length > 0;
        return {
          key: definition.key,
          label: definition.label,
          description,
          value: configured ? SITE_SETTING_SECRET_UNCHANGED : '',
          configured,
          isSensitive: true,
          source
        };
      }

      return {
        key: definition.key,
        label: definition.label,
        description,
        value: stored ?? resolveSiteSettingDefaultValue(definition),
        configured: source === 'db',
        isSensitive: false,
        source
      };
    });
  }

  public async updateAdminSettings(
    patch: AdminSiteSettingsPatch
  ): Promise<AdminSiteSettingEntry<K>[]> {
    const { registry, corsRulesKey } = this.config;
    const rows: SiteSettingUpsertInput[] = [];
    let corsRulesForCache: CorsRule[] | undefined;

    for (const [rawKey, rawValue] of Object.entries(patch.settings)) {
      if (!registry.isKey(rawKey)) {
        continue;
      }

      const definition = registry.get(rawKey);

      if (definition.isSensitive) {
        if (
          typeof rawValue !== 'string' ||
          !rawValue.trim() ||
          rawValue === SITE_SETTING_SECRET_UNCHANGED
        ) {
          continue;
        }
        rows.push({
          key: rawKey,
          value: this.requireSecretCipher().encrypt(rawValue.trim()),
          description: definition.description,
          isSensitive: true
        });
        continue;
      }

      if (rawKey === corsRulesKey) {
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
        this.config.corsCacheKey,
        buildRuntimeCorsConfig(
          corsRulesForCache,
          this.resolveDefaultCorsMethods()
        )
      );
    }

    return this.getAdminSettings();
  }

  protected async ensureSeeded(existingKeys: ReadonlySet<string>): Promise<void> {
    const missing = this.config.registry
      .seedRows()
      .filter((row) => !existingKeys.has(row.key));
    if (missing.length > 0) {
      await this.repo.upsertMany(missing);
    }
  }

  protected async loadSnapshot(): Promise<Snapshot> {
    const { registry, snapshotCacheKey, snapshotTtlMs } = this.config;
    const cached = await this.cache.getItem<CachedSnapshot>(snapshotCacheKey);
    if (cached) {
      return {
        values: new Map(Object.entries(cached.values)),
        sources: new Map(Object.entries(cached.sources)),
        descriptions: new Map(Object.entries(cached.descriptions ?? {}))
      };
    }

    let rows = await this.repo.getAll();
    if (rows.length < registry.definitions.length) {
      await this.ensureSeeded(new Set(rows.map((row) => row.key)));
      rows = await this.repo.getAll();
    }

    const values = new Map<string, SiteSettingPrimitive>();
    const sources = new Map<string, 'db' | 'default'>();
    const descriptions = new Map<string, string>();

    for (const row of rows) {
      if (!registry.isKey(row.key)) {
        continue;
      }
      const definition = registry.get(row.key);
      values.set(
        row.key,
        definition.isSensitive
          ? String(row.value ?? '')
          : (row.value as SiteSettingPrimitive)
      );
      sources.set(row.key, 'db');
      if (row.description?.trim()) {
        descriptions.set(row.key, row.description.trim());
      }
    }

    for (const definition of registry.definitions) {
      if (!values.has(definition.key)) {
        values.set(definition.key, resolveSiteSettingDefaultValue(definition));
        sources.set(definition.key, 'default');
      }
    }

    await this.cache.setItem(
      snapshotCacheKey,
      {
        values: Object.fromEntries(values),
        sources: Object.fromEntries(sources),
        descriptions: Object.fromEntries(descriptions)
      } satisfies CachedSnapshot,
      { ttlMs: snapshotTtlMs ?? DEFAULT_SNAPSHOT_TTL_MS }
    );
    return { values, sources, descriptions };
  }
}
