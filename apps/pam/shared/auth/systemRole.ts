/**
 * Platform system roles (PAM).
 * Bound via pam_users.role_id → pam_roles.key (user|operator|admin).
 * is_platform_admin is legacy.
 *
 * Permission identifiers are immutable permission_key values.
 */

import { SYSTEM_ADMIN_GATE_KEY } from './permissionDefaults';
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

/** Expand system role to permission_key list. */
export function expandSystemPermissions(
  role: SystemRoleType
): readonly string[] {
  return resolveSystemPermissions(role);
}

export function hasSystemPermission(
  role: SystemRoleType,
  permissionKey: string
): boolean {
  return expandSystemPermissions(role).includes(permissionKey);
}

/** /admin gate: operator or admin (has admin_site_settings_read). */
export function isPlatformAdminRole(role: SystemRoleType): boolean {
  return hasSystemPermission(role, SYSTEM_ADMIN_GATE_KEY);
}

export function normalizeSystemRole(value: unknown): SystemRoleType {
  return isSystemRole(value) ? value : SystemRole.User;
}
