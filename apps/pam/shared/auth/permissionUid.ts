/**
 * Immutable API permission uid: `{method}_{pathTemplate}`.
 * Keep in sync with apps/pam/makes/sql/020-pam-roles.sql
 *
 * Display / i18n id is {@link permissionSlug} → key `permission:{slug}`.
 */

export type PermissionHttpMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE'
  | 'get'
  | 'post'
  | 'patch'
  | 'put'
  | 'delete';

/**
 * Build permission uid from HTTP method + API path template (`API_*` constant).
 * Uid must not be hand-edited after seed; regenerate only by inserting a new row.
 */
export function permissionUid(
  method: PermissionHttpMethod,
  pathTemplate: string
): string {
  const m = method.toLowerCase();
  const path = pathTemplate.startsWith('/') ? pathTemplate : `/${pathTemplate}`;
  return `${m}_${path}`;
}

/**
 * Stable slug / i18n id derived from uid.
 * `get_/api/admin/roles` → `get_api_admin_roles`
 * `patch_/api/pam/:projectId/collaborators/:userId` → `patch_api_pam_projectId_collaborators_userId`
 */
export function permissionSlug(uid: string): string {
  const match = /^([a-z]+)_(.+)$/i.exec(uid);
  if (!match) {
    return uid
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  const method = match[1].toLowerCase();
  // Keep path param casing (projectId, userId) so i18n keys stay stable.
  const pathSlug = match[2]
    .replace(/^\//, '')
    .replace(/:/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${method}_${pathSlug}`;
}

/** next-intl / ts2locales key: `permission:{slug}`. */
export function permissionI18nKey(slugOrUid: string): string {
  const slug =
    slugOrUid.includes('/') || slugOrUid.includes(':')
      ? permissionSlug(slugOrUid)
      : slugOrUid;
  return `permission:${slug}`;
}
