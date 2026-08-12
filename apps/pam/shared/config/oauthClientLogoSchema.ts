import {
  OAuthClientCreateSchema,
  OAuthClientUpdateSchema
} from '@qlover/oauth-wrapper';
import { z } from 'zod';

/**
 * Optional HTTPS (or any URL) logo for OAuth clients.
 * Empty string clears the stored logo_uri.
 */
export const oauthClientLogoUriSchema = z
  .string()
  .url()
  .optional()
  .or(z.literal(''));

/**
 * Create body with logo_uri until @qlover/oauth-wrapper ships it on CreateSchema.
 */
export const OAuthClientCreateWithLogoSchema = OAuthClientCreateSchema.extend({
  logo_uri: oauthClientLogoUriSchema
});

/**
 * Update body with logo_uri until @qlover/oauth-wrapper ships it on UpdateSchema.
 */
export const OAuthClientUpdateWithLogoSchema = OAuthClientUpdateSchema.extend({
  logo_uri: oauthClientLogoUriSchema
});

export type OAuthClientCreateWithLogo = z.infer<
  typeof OAuthClientCreateWithLogoSchema
>;
export type OAuthClientUpdateWithLogo = z.infer<
  typeof OAuthClientUpdateWithLogoSchema
>;

/**
 * Normalize optional logo_uri form/API values for DB write.
 */
export function normalizeLogoUri(
  logoUri: string | null | undefined
): string | null {
  const trimmed = logoUri?.trim();
  return trimmed ? trimmed : null;
}
