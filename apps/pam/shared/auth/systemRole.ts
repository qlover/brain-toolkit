/**
 * Platform system roles and permission map (PAM).
 * Stored in pam_users.system_role (new column). is_platform_admin is legacy.
 */

export const SystemRole = {
  User: 'user',
  Operator: 'operator',
  Admin: 'admin'
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];

export const SYSTEM_ROLES = [
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
] as const;

export function isSystemRole(value: unknown): value is SystemRoleType {
  return (
    value === SystemRole.User ||
    value === SystemRole.Operator ||
    value === SystemRole.Admin
  );
}

export const SystemPermission = {
  AdminAccess: 'admin.access',
  UsersRead: 'users.read',
  UsersWrite: 'users.write',
  AuditRead: 'audit.read'
} as const;

export type SystemPermissionType =
  (typeof SystemPermission)[keyof typeof SystemPermission];

const ROLE_PERMISSIONS: Record<
  SystemRoleType,
  readonly SystemPermissionType[]
> = {
  [SystemRole.User]: [],
  [SystemRole.Operator]: [
    SystemPermission.AdminAccess,
    SystemPermission.UsersRead,
    SystemPermission.AuditRead
  ],
  [SystemRole.Admin]: [
    SystemPermission.AdminAccess,
    SystemPermission.UsersRead,
    SystemPermission.UsersWrite,
    SystemPermission.AuditRead
  ]
};

export function expandSystemPermissions(
  role: SystemRoleType
): readonly SystemPermissionType[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasSystemPermission(
  role: SystemRoleType,
  permission: SystemPermissionType
): boolean {
  return expandSystemPermissions(role).includes(permission);
}

/** /admin gate: has admin.access (operator or admin). */
export function isPlatformAdminRole(role: SystemRoleType): boolean {
  return hasSystemPermission(role, SystemPermission.AdminAccess);
}

export function normalizeSystemRole(value: unknown): SystemRoleType {
  return isSystemRole(value) ? value : SystemRole.User;
}
