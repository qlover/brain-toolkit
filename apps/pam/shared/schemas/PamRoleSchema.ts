import { z } from 'zod';
import { RoleKind } from '@shared/auth/roleKeys';

export const pamRoleKindSchema = z.enum([RoleKind.Platform, RoleKind.Team]);

export type PamRoleKind = z.infer<typeof pamRoleKindSchema>;

export const pamAdminPermissionItemSchema = z.object({
  uid: z.string(),
  /** i18n id: use as `permission:{slug}` */
  slug: z.string(),
  type: z.string(),
  method: z.string(),
  path: z.string(),
  /** DB-only note; UI should use permission:{slug} translations */
  description: z.string().nullable()
});

export type PamAdminPermissionItem = z.infer<
  typeof pamAdminPermissionItemSchema
>;

export const pamAdminRoleItemSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  kind: pamRoleKindSchema,
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissionUids: z.array(z.string())
});

export type PamAdminRoleItem = z.infer<typeof pamAdminRoleItemSchema>;

export const pamAdminRolesResponseSchema = z.object({
  catalog: z.array(pamAdminPermissionItemSchema),
  roles: z.array(pamAdminRoleItemSchema),
  /** @deprecated Prefer `roles`; kept for older clients */
  system: z.record(z.string(), z.array(z.string())).optional(),
  /** @deprecated Prefer `roles`; kept for older clients */
  org: z.record(z.string(), z.array(z.string())).optional()
});

export type PamAdminRolesResponse = z.infer<typeof pamAdminRolesResponseSchema>;

export const pamAdminRoleAssignmentsPatchSchema = z.object({
  roleId: z.string().uuid(),
  permissionUids: z.array(z.string().min(1))
});

export type PamAdminRoleAssignmentsPatch = z.infer<
  typeof pamAdminRoleAssignmentsPatchSchema
>;
