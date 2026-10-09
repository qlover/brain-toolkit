import {
  adminPermissionCreateSchema,
  adminPermissionItemSchema,
  adminPermissionsResponseSchema,
  adminPermissionUpdateSchema,
  adminRoleAssignmentsPatchSchema,
  adminRoleItemSchema
} from '@brain-toolkit/next-app-kit/shared';
import { z } from 'zod';
import { RoleKind } from '@shared/auth/roleKeys';

export const pamRoleKindSchema = z.enum([RoleKind.Platform, RoleKind.Team]);

export type PamRoleKind = z.infer<typeof pamRoleKindSchema>;

export const pamAdminPermissionItemSchema = adminPermissionItemSchema;

export type PamAdminPermissionItem = z.infer<
  typeof pamAdminPermissionItemSchema
>;

export const pamAdminRoleItemSchema = adminRoleItemSchema.extend({
  kind: pamRoleKindSchema
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

export const pamAdminRoleAssignmentsPatchSchema =
  adminRoleAssignmentsPatchSchema;

export type PamAdminRoleAssignmentsPatch = z.infer<
  typeof pamAdminRoleAssignmentsPatchSchema
>;

export const pamAdminPermissionCreateSchema = adminPermissionCreateSchema;

export type PamAdminPermissionCreate = z.infer<
  typeof pamAdminPermissionCreateSchema
>;

export const pamAdminPermissionUpdateSchema = adminPermissionUpdateSchema;

export type PamAdminPermissionUpdate = z.infer<
  typeof pamAdminPermissionUpdateSchema
>;

export const pamAdminPermissionsResponseSchema = adminPermissionsResponseSchema;

export type PamAdminPermissionsResponse = z.infer<
  typeof pamAdminPermissionsResponseSchema
>;
