import { z } from 'zod';

/**
 * Body for `POST /api/pam/cli/token`.
 */
export const PamCliTokenRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export type PamCliTokenRequest = z.infer<typeof PamCliTokenRequestSchema>;

/**
 * CLI / PAM UI locales accepted on device approve and token responses.
 */
export const PamCliLocaleSchema = z.enum(['en', 'zh']);

export type PamCliLocale = z.infer<typeof PamCliLocaleSchema>;

/**
 * Successful CLI token response data.
 */
export const PamCliTokenResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().min(1),
  user: z.object({
    id: z.string(),
    email: z.string().optional()
  }),
  /** Browser page locale when issued via device approve. */
  locale: PamCliLocaleSchema.optional()
});

export type PamCliTokenResponse = z.infer<typeof PamCliTokenResponseSchema>;

/**
 * Owner-only decrypted environment export payload.
 */
export const PamCliExportResponseSchema = z.object({
  projectId: z.string().uuid(),
  projectSlug: z.string().min(1),
  environmentId: z.string().uuid(),
  environmentName: z.string().min(1),
  content: z.string()
});

export type PamCliExportResponse = z.infer<typeof PamCliExportResponseSchema>;

/**
 * Body for `POST /api/pam/cli/device/token` (CLI poll).
 */
export const PamCliDeviceTokenRequestSchema = z.object({
  device_code: z.string().trim().min(1)
});

export type PamCliDeviceTokenRequest = z.infer<
  typeof PamCliDeviceTokenRequestSchema
>;

/**
 * Body for `POST /api/pam/cli/device/approve` (browser session).
 */
export const PamCliDeviceApproveRequestSchema = z.object({
  user_code: z.string().trim().min(1),
  /** Current browser UI locale (`/[locale]/pamenv/device`). */
  locale: PamCliLocaleSchema.optional()
});

export type PamCliDeviceApproveRequest = z.infer<
  typeof PamCliDeviceApproveRequestSchema
>;

/**
 * Response for `POST /api/pam/cli/device/code`.
 */
export const PamCliDeviceCodeResponseSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.string().min(1),
  verification_uri_complete: z.string().min(1),
  expires_in: z.number().int().positive(),
  interval: z.number().int().positive()
});

export type PamCliDeviceCodeResponse = z.infer<
  typeof PamCliDeviceCodeResponseSchema
>;
