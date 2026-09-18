import { z } from 'zod';
import {
  PAM_SITE_SETTING_KEYS,
  type PamCorsRule,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';
import {
  corsRuleSchema,
  corsValueSchema,
  type CorsValue
} from '@schemas/corsValueSchema';

export {
  corsOriginSchema,
  corsPathSchema,
  corsMethodSchema,
  corsRuleSchema,
  corsValueSchema,
  corsRuleIdentity,
  isValidCorsOriginValue,
  isValidCorsPathValue,
  type CorsRuleValue,
  type CorsValue
} from '@schemas/corsValueSchema';

export const pamSiteSettingRowSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  description: z.string(),
  is_sensitive: z.boolean(),
  updated_at: z.string()
});

export type PamSiteSettingRow = z.infer<typeof pamSiteSettingRowSchema>;

export const pamPublicConfigSchema = z.object({
  auth: z.object({
    phoneLoginEnabled: z.boolean(),
    phoneOtpProvider: z.enum(['memory', 'aliyun']).optional(),
    googleOauthEnabled: z.boolean(),
    brainPkceEnabled: z.boolean(),
    brainSupabaseEnabled: z.boolean()
  })
});

export type PamPublicConfig = z.infer<typeof pamPublicConfigSchema>;

/** @deprecated 请用 {@link corsRuleSchema} / {@link corsValueSchema}。 */
export const pamCorsRuleSchema = corsRuleSchema;

export const pamAdminSiteSettingValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.string()),
  corsValueSchema
]);

export const pamAdminSiteSettingsPatchSchema = z.object({
  settings: z.record(z.string(), pamAdminSiteSettingValueSchema)
});

export type PamAdminSiteSettingsPatch = z.infer<
  typeof pamAdminSiteSettingsPatchSchema
>;

export type PamAdminSiteSettingEntry = {
  key: PamSiteSettingKey;
  label: string;
  description: string;
  value: string | boolean | string[] | PamCorsRule[];
  configured: boolean;
  isSensitive: boolean;
  source: 'db' | 'default';
};

export const pamAdminSiteSettingsResponseSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      description: z.string(),
      value: z.union([
        z.string(),
        z.boolean(),
        z.array(z.string()),
        corsValueSchema
      ]),
      configured: z.boolean(),
      isSensitive: z.boolean(),
      source: z.enum(['db', 'default'])
    })
  )
});

export type PamAdminSiteSettingsResponse = z.infer<
  typeof pamAdminSiteSettingsResponseSchema
>;

export function isPamSiteSettingKey(key: string): key is PamSiteSettingKey {
  return Object.values(PAM_SITE_SETTING_KEYS).includes(
    key as PamSiteSettingKey
  );
}

export function parseCorsValue(value: unknown): CorsValue {
  return corsValueSchema.parse(value);
}

export function safeParseCorsValue(value: unknown): CorsValue | null {
  const result = corsValueSchema.safeParse(value);
  return result.success ? result.data : null;
}
