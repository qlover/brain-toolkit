/**
 * Platform system roles (PAM).
 * Bound via pam_users.role_id → pam_roles.key (user|operator|admin).
 * is_platform_admin is legacy.
 *
 * Permission identifiers are immutable API uids (method_path).
 */

import { SYSTEM_ADMIN_GATE_UID } from './permissionDefaults';
import { resolveSystemPermissions } from './permissionRegistry';

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

/** Expand system role to API permission uids. */
export function expandSystemPermissions(
  role: SystemRoleType
): readonly string[] {
  return resolveSystemPermissions(role);
}

export function hasSystemPermission(
  role: SystemRoleType,
  permissionUid: string
): boolean {
  return expandSystemPermissions(role).includes(permissionUid);
}

/** /admin gate: operator or admin (has admin site-settings read uid). */
export function isPlatformAdminRole(role: SystemRoleType): boolean {
  return hasSystemPermission(role, SYSTEM_ADMIN_GATE_UID);
}

export function normalizeSystemRole(value: unknown): SystemRoleType {
  return isSystemRole(value) ? value : SystemRole.User;
}
