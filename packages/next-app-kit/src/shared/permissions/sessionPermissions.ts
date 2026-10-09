/**
 * Resolve a platform permission from a cookie/JWT session user when present.
 *
 * - `permissions: string[]` (non-empty) wins.
 * - Otherwise `system_role` is expanded through `resolveRole`.
 * - `null` means the session is too thin; callers should hit the DB.
 */
export function sessionHasPermission(
  user: unknown,
  permissionKey: string,
  resolveRole: (roleKey: string) => readonly string[]
): boolean | null {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const rec = user as Record<string, unknown>;
  const permissions = rec.permissions;
  if (Array.isArray(permissions) && permissions.length > 0) {
    return permissions.includes(permissionKey);
  }
  if (typeof rec.system_role === 'string' && rec.system_role.length > 0) {
    return resolveRole(rec.system_role).includes(permissionKey);
  }
  return null;
}

/** Read `permissions` from a session user (client capability checks). */
export function sessionPermissions(user: unknown): readonly string[] {
  if (!user || typeof user !== 'object') {
    return [];
  }
  const permissions = (user as Record<string, unknown>).permissions;
  return Array.isArray(permissions)
    ? permissions.filter((key): key is string => typeof key === 'string')
    : [];
}
