import { z } from 'zod';
import { OrgRole } from '@shared/auth/orgRole';
import { SystemRole } from '@shared/auth/systemRole';

export const pamPermissionScopeSchema = z.enum(['system', 'org']);

export type PamPermissionScope = z.infer<typeof pamPermissionScopeSchema>;

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

export const pamAdminRolesResponseSchema = z.object({
  catalog: z.array(pamAdminPermissionItemSchema),
  system: z.record(z.string(), z.array(z.string())),
  org: z.record(z.string(), z.array(z.string()))
});

export type PamAdminRolesResponse = z.infer<typeof pamAdminRolesResponseSchema>;

const systemRoleKeySchema = z.enum([
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
]);

const orgRoleKeySchema = z.enum([OrgRole.Member, OrgRole.Admin, OrgRole.Owner]);

export const pamAdminRoleAssignmentsPatchSchema = z
  .object({
    scope: pamPermissionScopeSchema,
    roleKey: z.string().min(1),
    permissionUids: z.array(z.string().min(1))
  })
  .superRefine((value, ctx) => {
    if (
      value.scope === 'system' &&
      !systemRoleKeySchema.safeParse(value.roleKey).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roleKey'],
        message: 'Invalid system role key'
      });
    }
    if (
      value.scope === 'org' &&
      !orgRoleKeySchema.safeParse(value.roleKey).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roleKey'],
        message: 'Invalid org role key'
      });
    }
  });

export type PamAdminRoleAssignmentsPatch = z.infer<
  typeof pamAdminRoleAssignmentsPatchSchema
>;
