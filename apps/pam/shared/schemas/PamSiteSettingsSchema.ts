import {
  adminSiteSettingsPatchSchema,
  adminSiteSettingsResponseSchema,
  adminSiteSettingValueSchema,
  corsRuleSchema,
  siteSettingRowSchema,
  type AdminSiteSettingEntry,
  type AdminSiteSettingsPatch,
  type AdminSiteSettingsResponse,
  type SiteSettingRow
} from '@brain-toolkit/next-app-kit/shared';
import { z } from 'zod';
import {
  pamSiteSettingRegistry,
  type PamSiteSettingKey
} from '@config/pamSiteSettings';

export {
  corsOriginSchema,
  corsPathSchema,
  corsMethodSchema,
  corsRuleSchema,
  corsValueSchema,
  corsRuleIdentity,
  isValidCorsOriginValue,
  isValidCorsPathValue,
  parseCorsValue,
  safeParseCorsValue,
  type CorsRuleValue,
  type CorsValue
} from '@brain-toolkit/next-app-kit/shared';

export const pamSiteSettingRowSchema = siteSettingRowSchema;

export type PamSiteSettingRow = SiteSettingRow;

export const pamPublicConfigSchema = z.object({
  auth: z.object({
    phoneLoginEnabled: z.boolean(),
    phoneOtpProvider: z.enum(['memory', 'aliyun']).optional(),
    googleOauthEnabled: z.boolean(),
    brainPkceEnabled: z.boolean(),
    brainSupabaseEnabled: z.boolean(),
    passwordResetEnabled: z.boolean().optional()
  })
});

export type PamPublicConfig = z.infer<typeof pamPublicConfigSchema>;

/** @deprecated 请用 {@link corsRuleSchema} / {@link corsValueSchema}。 */
export const pamCorsRuleSchema = corsRuleSchema;

export const pamAdminSiteSettingValueSchema = adminSiteSettingValueSchema;

export const pamAdminSiteSettingsPatchSchema = adminSiteSettingsPatchSchema;

export type PamAdminSiteSettingsPatch = AdminSiteSettingsPatch;

export type PamAdminSiteSettingEntry = AdminSiteSettingEntry<PamSiteSettingKey>;

export const pamAdminSiteSettingsResponseSchema =
  adminSiteSettingsResponseSchema;

export type PamAdminSiteSettingsResponse = AdminSiteSettingsResponse;

export function isPamSiteSettingKey(key: string): key is PamSiteSettingKey {
  return pamSiteSettingRegistry.isKey(key);
}
