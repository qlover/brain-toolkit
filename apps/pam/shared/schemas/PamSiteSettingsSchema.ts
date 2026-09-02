import { z } from 'zod';
import {
  PAM_SITE_SETTING_KEYS,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';

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
    googleOauthEnabled: z.boolean(),
    brainPkceEnabled: z.boolean(),
    brainSupabaseEnabled: z.boolean()
  })
});

export type PamPublicConfig = z.infer<typeof pamPublicConfigSchema>;

export const pamAdminSiteSettingValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.string())
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
  value: string | boolean | string[];
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
      value: z.union([z.string(), z.boolean(), z.array(z.string())]),
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
