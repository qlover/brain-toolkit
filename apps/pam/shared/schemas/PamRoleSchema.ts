import { z } from 'zod';
import { RoleKind } from '@shared/auth/roleKeys';

export const pamRoleKindSchema = z.enum([RoleKind.Platform, RoleKind.Team]);

export type PamRoleKind = z.infer<typeof pamRoleKindSchema>;

export const pamAdminPermissionItemSchema = z.object({
  /** Sole permission identity */
  permissionKey: z.string(),
  type: z.string(),
  method: z.string().nullable(),
  path: z.string().nullable(),
  /** DB-only note; UI uses permission:{permissionKey} */
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
  permissionKeys: z.array(z.string())
});

export type PamAdminRoleItem = z.infer<typeof pamAdminRoleItemSchema>;

export const pamAdminRolesResponseSchema = z.object({
  catalog: z.array(pamAdminPermissionItemSchema),
  roles: z.array(pamAdminRoleItemSchema),
  /** @deprecated Prefer `roles` */
  system: z.record(z.string(), z.array(z.string())).optional(),
  /** @deprecated Prefer `roles` */
  org: z.record(z.string(), z.array(z.string())).optional()
});

export type PamAdminRolesResponse = z.infer<typeof pamAdminRolesResponseSchema>;

export const pamAdminRoleAssignmentsPatchSchema = z.object({
  roleId: z.string().uuid(),
  permissionKeys: z.array(z.string().min(1))
});

export type PamAdminRoleAssignmentsPatch = z.infer<
  typeof pamAdminRoleAssignmentsPatchSchema
>;

const permissionKeyField = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Invalid permission_key format');

export const pamAdminPermissionCreateSchema = z.object({
  permissionKey: permissionKeyField,
  type: z.enum(['api', 'page', 'feature']).default('api'),
  method: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type PamAdminPermissionCreate = z.infer<
  typeof pamAdminPermissionCreateSchema
>;

export const pamAdminPermissionUpdateSchema = z.object({
  permissionKey: permissionKeyField,
  type: z.enum(['api', 'page', 'feature']).optional(),
  method: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type PamAdminPermissionUpdate = z.infer<
  typeof pamAdminPermissionUpdateSchema
>;

export const pamAdminPermissionsResponseSchema = z.object({
  catalog: z.array(pamAdminPermissionItemSchema)
});

export type PamAdminPermissionsResponse = z.infer<
  typeof pamAdminPermissionsResponseSchema
>;
