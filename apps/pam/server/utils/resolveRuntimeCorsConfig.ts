import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type { SiteSettingsService } from '@server/services/SiteSettingsService';

export type RuntimeCorsConfig = Pick<
  SeedServerConfigInterface,
  'apiCorsAllowedOrigins' | 'apiCorsAllowedMethods'
>;

/**
 * Resolves effective CORS config (DB → env fallback).
 */
export async function resolveRuntimeCorsConfig(
  siteSettings: SiteSettingsService
): Promise<RuntimeCorsConfig> {
  return siteSettings.getCorsConfig();
}
