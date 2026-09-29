import { z } from 'zod';
import { PERMISSION_KEY_PATTERN } from './permissionKeys';

export const adminPermissionTypeSchema = z.enum(['api', 'page', 'feature']);

export type AdminPermissionType = z.infer<typeof adminPermissionTypeSchema>;

export const adminPermissionItemSchema = z.object({
  permissionKey: z.string(),
  type: z.string(),
  method: z.string().nullable(),
  path: z.string().nullable(),
  /** DB-only note; UI uses permission:{permissionKey} */
  description: z.string().nullable()
});

export type AdminPermissionItem = z.infer<typeof adminPermissionItemSchema>;

export const adminRoleItemSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  kind: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissionKeys: z.array(z.string())
});

export type AdminRoleItem = z.infer<typeof adminRoleItemSchema>;

export const adminRolesResponseSchema = z.object({
  catalog: z.array(adminPermissionItemSchema),
  roles: z.array(adminRoleItemSchema)
});

export type AdminRolesResponse = z.infer<typeof adminRolesResponseSchema>;

export const adminRoleAssignmentsPatchSchema = z.object({
  roleId: z.string().uuid(),
  permissionKeys: z.array(z.string().min(1))
});

export type AdminRoleAssignmentsPatch = z.infer<
  typeof adminRoleAssignmentsPatchSchema
>;

export const adminPermissionKeyFieldSchema = z
  .string()
  .min(1)
  .regex(PERMISSION_KEY_PATTERN, 'Invalid permission_key format');

export const adminPermissionCreateSchema = z.object({
  permissionKey: adminPermissionKeyFieldSchema,
  type: adminPermissionTypeSchema.default('api'),
  method: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type AdminPermissionCreate = z.infer<typeof adminPermissionCreateSchema>;

export const adminPermissionUpdateSchema = z.object({
  permissionKey: adminPermissionKeyFieldSchema,
  type: adminPermissionTypeSchema.optional(),
  method: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});

export type AdminPermissionUpdate = z.infer<typeof adminPermissionUpdateSchema>;

export const adminPermissionsResponseSchema = z.object({
  catalog: z.array(adminPermissionItemSchema)
});

export type AdminPermissionsResponse = z.infer<
  typeof adminPermissionsResponseSchema
>;
