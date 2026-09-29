import { z } from 'zod';
import { corsValueSchema, type CorsValue } from './corsValueSchema';

/** One CORS allow rule stored in site settings; any part may be `*`. */
export type CorsRule = {
  readonly origin: string;
  readonly path: string;
  readonly methods: readonly string[];
};

export type SiteSettingPrimitive = string | boolean | string[] | CorsRule[];

export type SiteSettingDefinition<K extends string = string> = {
  readonly key: K;
  /** Short title shown in Admin UI. */
  readonly label: string;
  /** Help text for operators. */
  readonly description: string;
  readonly isSensitive: boolean;
  readonly defaultValue?: SiteSettingPrimitive;
};

/** Conventional key for the CORS rule list. */
export const SITE_SETTING_CORS_RULES_KEY = 'api.cors_rules' as const;

/** Sentinel: admin PATCH omits secret change when value equals this. */
export const SITE_SETTING_SECRET_UNCHANGED = '__UNCHANGED__' as const;

export const siteSettingRowSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  description: z.string(),
  is_sensitive: z.boolean(),
  updated_at: z.string()
});

export type SiteSettingRow = z.infer<typeof siteSettingRowSchema>;

export type SiteSettingUpsertInput = {
  readonly key: string;
  readonly value: unknown;
  readonly description: string;
  readonly isSensitive: boolean;
};

export const adminSiteSettingValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.string()),
  corsValueSchema
]);

export const adminSiteSettingsPatchSchema = z.object({
  settings: z.record(z.string(), adminSiteSettingValueSchema)
});

export type AdminSiteSettingsPatch = z.infer<
  typeof adminSiteSettingsPatchSchema
>;

export type AdminSiteSettingEntry<K extends string = string> = {
  key: K;
  label: string;
  description: string;
  value: SiteSettingPrimitive;
  configured: boolean;
  isSensitive: boolean;
  source: 'db' | 'default';
};

export const adminSiteSettingsResponseSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      description: z.string(),
      value: adminSiteSettingValueSchema,
      configured: z.boolean(),
      isSensitive: z.boolean(),
      source: z.enum(['db', 'default'])
    })
  )
});

export type AdminSiteSettingsResponse = z.infer<
  typeof adminSiteSettingsResponseSchema
>;

export function parseCorsValue(value: unknown): CorsValue {
  return corsValueSchema.parse(value);
}

export function safeParseCorsValue(value: unknown): CorsValue | null {
  const result = corsValueSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function isCorsRuleArray(value: unknown): value is CorsRule[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item != null &&
        typeof item === 'object' &&
        'origin' in item &&
        'path' in item &&
        'methods' in item
    )
  );
}

export function resolveSiteSettingDefaultValue(
  definition: SiteSettingDefinition
): SiteSettingPrimitive {
  return definition.defaultValue ?? '';
}

/** App-specific list of site settings (key → label / default / sensitivity). */
export class SiteSettingRegistry<K extends string> {
  protected readonly byKey: ReadonlyMap<string, SiteSettingDefinition<K>>;

  constructor(public readonly definitions: readonly SiteSettingDefinition<K>[]) {
    this.byKey = new Map(
      definitions.map((definition) => [definition.key, definition])
    );
  }

  public isKey(key: string): key is K {
    return this.byKey.has(key);
  }

  public get(key: K): SiteSettingDefinition<K> {
    const definition = this.byKey.get(key);
    if (!definition) {
      throw new Error(`Unknown site setting key: ${key}`);
    }
    return definition;
  }

  public seedRows(): SiteSettingUpsertInput[] {
    return this.definitions.map((definition) => ({
      key: definition.key,
      value: resolveSiteSettingDefaultValue(definition),
      description: definition.description,
      isSensitive: definition.isSensitive
    }));
  }
}
