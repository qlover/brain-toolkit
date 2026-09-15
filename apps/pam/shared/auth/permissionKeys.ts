/**
 * Immutable permission_key — sole permission identity (DB / session / UI / i18n).
 *
 * Rules: /^[A-Za-z_][A-Za-z0-9_]*$/
 * i18n: permission:{permission_key}
 * UI test: data-permission="{permission_key}"
 *
 * method/path on pam_role_permissions are catalog metadata only.
 */

export const PERMISSION_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const PermissionKey = {
  // —— platform / admin ——
  admin_users_read: 'admin_users_read',
  admin_users_platform_admin: 'admin_users_platform_admin',
  admin_users_system_role: 'admin_users_system_role',
  admin_roles_read: 'admin_roles_read',
  admin_roles_write: 'admin_roles_write',
  admin_request_logs_read: 'admin_request_logs_read',
  admin_phone_otps_read: 'admin_phone_otps_read',
  admin_site_settings_read: 'admin_site_settings_read',
  admin_site_settings_write: 'admin_site_settings_write',

  // —— platform app ——
  pam_project_create: 'pam_project_create',
  pam_project_fork: 'pam_project_fork',
  pam_teams_list: 'pam_teams_list',
  pam_teams_create: 'pam_teams_create',

  // —— team / project ——
  pam_teams_read: 'pam_teams_read',
  pam_teams_members_create: 'pam_teams_members_create',
  pam_teams_members_update: 'pam_teams_members_update',
  pam_teams_members_delete: 'pam_teams_members_delete',
  pam_teams_projects_attach: 'pam_teams_projects_attach',
  pam_collaborators_read: 'pam_collaborators_read',
  pam_collaborators_create: 'pam_collaborators_create',
  pam_collaborators_update: 'pam_collaborators_update',
  pam_collaborators_delete: 'pam_collaborators_delete',
  pam_environments_create: 'pam_environments_create',
  pam_environments_delete: 'pam_environments_delete',
  pam_environments_variables_write: 'pam_environments_variables_write',
  pam_environments_export: 'pam_environments_export',
  pam_project_edit: 'pam_project_edit',
  pam_project_delete: 'pam_project_delete',
  pam_project_transfer: 'pam_project_transfer',
  pam_project_preview_write: 'pam_project_preview_write'
} as const;

export type PamPermissionKey =
  (typeof PermissionKey)[keyof typeof PermissionKey];

export const ALL_PERMISSION_KEYS = Object.values(
  PermissionKey
) as PamPermissionKey[];

export function isPermissionKey(value: unknown): value is PamPermissionKey {
  return (
    typeof value === 'string' &&
    PERMISSION_KEY_PATTERN.test(value) &&
    (ALL_PERMISSION_KEYS as string[]).includes(value)
  );
}

export function assertPermissionKey(value: string): PamPermissionKey {
  if (!PERMISSION_KEY_PATTERN.test(value)) {
    throw new Error(`Invalid permission_key format: ${value}`);
  }
  return value as PamPermissionKey;
}

/** next-intl / ts2locales: `permission:{permission_key}` */
export function permissionI18nKey(permissionKey: string): string {
  return `permission:${permissionKey}`;
}

/** Platform-console / create-project style keys (admin roles UI filter). */
export function isPlatformPermissionKey(key: string): boolean {
  if (key.startsWith('admin_')) return true;
  return (
    key === PermissionKey.pam_project_create ||
    key === PermissionKey.pam_project_fork ||
    key === PermissionKey.pam_teams_list ||
    key === PermissionKey.pam_teams_create
  );
}
