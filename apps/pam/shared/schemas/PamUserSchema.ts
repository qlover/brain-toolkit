import { z } from 'zod';

export const pamUserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  phone: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  is_platform_admin: z.boolean(),
  status: z.enum(['active', 'suspended']),
  created_at: z.string(),
  updated_at: z.string()
});

export type PamUserRow = z.infer<typeof pamUserRowSchema>;

export const pamAdminUserListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  phone: z.string().nullable().optional(),
  displayName: z.string().nullable(),
  isPlatformAdmin: z.boolean(),
  status: z.enum(['active', 'suspended']),
  createdAt: z.string()
});

export type PamAdminUserListItem = z.infer<typeof pamAdminUserListItemSchema>;

export const pamSessionCapabilitiesSchema = z.object({
  platformAdmin: z.boolean()
});

export type PamSessionCapabilities = z.infer<
  typeof pamSessionCapabilitiesSchema
>;

export const pamSessionUserSchema = z.object({
  id: z.string(),
  /** Business email; empty string when phone-only. */
  email: z.string(),
  phone: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  role: z.number(),
  credential_token: z.string().optional(),
  created_at: z.string().optional()
});

export type PamSessionUser = z.infer<typeof pamSessionUserSchema>;

export const pamSessionResponseSchema = z.object({
  user: pamSessionUserSchema.nullable(),
  capabilities: pamSessionCapabilitiesSchema
});

export type PamSessionResponse = z.infer<typeof pamSessionResponseSchema>;

export const pamPlatformAdminPatchSchema = z.object({
  enabled: z.boolean()
});

export const pamBindEmailSendSchema = z.object({
  email: z.string().email()
});

export type PamBindEmailSendInput = z.infer<typeof pamBindEmailSendSchema>;

export const pamBindEmailVerifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(4).max(12)
});

export type PamBindEmailVerifyInput = z.infer<typeof pamBindEmailVerifySchema>;

export const pamBindEmailVerifyResultSchema = z.object({
  merged: z.boolean(),
  user: pamSessionUserSchema
});

export type PamBindEmailVerifyResult = z.infer<
  typeof pamBindEmailVerifyResultSchema
>;
