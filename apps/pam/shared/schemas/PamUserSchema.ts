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
  /** Legacy column — kept until separate cleanup. */
  is_platform_admin: z.boolean().optional().default(false),
  /** FK to pam_roles (platform). */
  role_id: z.string().uuid(),
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
  /** @deprecated Prefer systemRole; true when system_role === admin */
  isPlatformAdmin: z.boolean(),
  systemRole: systemRoleSchema,
  status: z.enum(['active', 'suspended']),
  createdAt: z.string()
});

export type PamAdminUserListItem = z.infer<typeof pamAdminUserListItemSchema>;

/**
 * @deprecated Session is a flat PamSessionUser; keep for older clients only.
 */
export const pamSessionCapabilitiesSchema = z.object({
  platformAdmin: z.boolean(),
  roles: z.array(systemRoleSchema).optional().default([]),
  permissions: z.array(z.string()).optional().default([])
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
  /** next-kit UserRole enum number (not PAM system role). */
  role: z.number(),
  /** PAM platform role key: user | operator | admin */
  system_role: systemRoleSchema.default(SystemRole.User),
  /** Platform API permission uids for the current system_role (FE checks). */
  permissions: z.array(z.string()).default([]),
  credential_token: z.string().optional(),
  created_at: z.string().optional()
});

export type PamSessionUser = z.infer<typeof pamSessionUserSchema>;

/** GET /api/user/session — flat user or null (no { user, capabilities } wrap). */
export type PamSessionResponse = PamSessionUser | null;

export const pamPlatformAdminPatchSchema = z.object({
  enabled: z.boolean()
});

/** PATCH /api/admin/users/:userId/system-role */
export const pamSystemRolePatchSchema = z.object({
  systemRole: systemRoleSchema
});

export type PamSystemRolePatch = z.infer<typeof pamSystemRolePatchSchema>;

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
