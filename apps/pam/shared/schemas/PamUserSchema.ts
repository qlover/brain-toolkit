import { z } from 'zod';
import { SystemRole } from '@shared/auth/systemRole';

const systemRoleSchema = z.enum([
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
]);

export const pamUserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  phone: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  /** Legacy column — kept intact; do not drop until post-merge cleanup. */
  is_platform_admin: z.boolean(),
  /** New RBAC column (additive). */
  system_role: systemRoleSchema.default(SystemRole.User),
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
  /** UI toggle: system_role === admin */
  isPlatformAdmin: z.boolean(),
  systemRole: systemRoleSchema.optional(),
  status: z.enum(['active', 'suspended']),
  createdAt: z.string()
});

export type PamAdminUserListItem = z.infer<typeof pamAdminUserListItemSchema>;

export const pamSessionCapabilitiesSchema = z.object({
  /** True when role has admin.access (operator or admin). */
  platformAdmin: z.boolean(),
  roles: z.array(systemRoleSchema).default([]),
  permissions: z.array(z.string()).default([])
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

/**
 * Display name: 1–32 Unicode letters/numbers/underscore.
 * No spaces, punctuation (except `_`), or other symbols.
 */
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_]{1,32}$/u;

export function isValidDisplayName(value: string): boolean {
  return DISPLAY_NAME_PATTERN.test(value);
}

export const pamDisplayNameUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1)
    .max(32)
    .regex(DISPLAY_NAME_PATTERN, { message: 'Invalid display name' })
});

export type PamDisplayNameUpdateInput = z.infer<
  typeof pamDisplayNameUpdateSchema
>;
