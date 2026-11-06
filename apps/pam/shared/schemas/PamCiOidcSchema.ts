import { z } from 'zod';
import { V_REQUIRED } from '@config/i18n-identifier/common/validators';

/** GitHub `owner/repo`（与 Actions repository claim 一致）。 */
export const PamCiOidcRepositorySchema = z
  .string()
  .trim()
  .regex(/^[^/\s]+\/[^/\s]+$/, { message: V_REQUIRED });

export const PamCiOidcProviderSchema = z.literal('github');

export type PamCiOidcProviderType = z.infer<typeof PamCiOidcProviderSchema>;

/**
 * Body for `POST /api/pam/cli/oidc/exchange`.
 */
export const PamCliOidcExchangeRequestSchema = z.object({
  provider: PamCiOidcProviderSchema,
  idToken: z.string().trim().min(1)
});

export type PamCliOidcExchangeRequest = z.infer<
  typeof PamCliOidcExchangeRequestSchema
>;

/**
 * Body for `PUT /api/pam/:projectId/ci/oidc`.
 */
export const PamCiOidcBindingUpsertSchema = z.object({
  repository: PamCiOidcRepositorySchema,
  /** 可选；省略则用站点默认 audience。 */
  audience: z.string().trim().min(1).optional()
});

export type PamCiOidcBindingUpsert = z.infer<
  typeof PamCiOidcBindingUpsertSchema
>;

export const PamCiOidcBindingSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  provider: PamCiOidcProviderSchema,
  repository: z.string(),
  ciUserId: z.string().uuid(),
  audience: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PamCiOidcBinding = z.infer<typeof PamCiOidcBindingSchema>;
