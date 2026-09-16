/**
 * Default role → permission_key maps (seed / fallback when DB not loaded).
 * Keep in sync with apps/pam/makes/sql/020-pam-roles.sql
 */

import { PermissionKey } from './permissionKeys';

/** Project access flags derived from team-role permission_keys. */
export const OrgFlagPermission = {
  Edit: PermissionKey.pam_project_edit,
  ManageCollaborators: PermissionKey.pam_collaborators_create,
  Delete: PermissionKey.pam_project_delete
} as const;

/** /admin gate: operator+ (has site-settings read). */
export const SYSTEM_ADMIN_GATE_KEY = PermissionKey.admin_site_settings_read;

const ADMIN_READ = [
  PermissionKey.admin_users_read,
  PermissionKey.admin_roles_read,
  PermissionKey.admin_request_logs_read,
  PermissionKey.admin_phone_otps_read,
  PermissionKey.admin_site_settings_read
] as const;

const ADMIN_WRITE = [
  PermissionKey.admin_users_platform_admin,
  PermissionKey.admin_users_system_role,
  PermissionKey.admin_roles_write,
  PermissionKey.admin_site_settings_write
] as const;

/** Super-admin only: permission catalog CRUD (not granted to operator). */
const ADMIN_PERMISSIONS_CATALOG = [
  PermissionKey.admin_permissions_read,
  PermissionKey.admin_permissions_write
] as const;

const TEAM_MEMBER = [PermissionKey.pam_teams_read] as const;

const TEAM_ADMIN = [
  ...TEAM_MEMBER,
  PermissionKey.pam_teams_members_create,
  PermissionKey.pam_teams_members_update,
  PermissionKey.pam_teams_members_delete,
  PermissionKey.pam_teams_projects_attach
] as const;

const ORG_MEMBER = [
  PermissionKey.pam_collaborators_read,
  PermissionKey.pam_environments_read,
  PermissionKey.pam_environments_create,
  PermissionKey.pam_environments_variables_write,
  PermissionKey.pam_environments_export,
  PermissionKey.pam_project_edit,
  PermissionKey.pam_project_preview_write,
  ...TEAM_MEMBER
] as const;

const ORG_ADMIN = [
  ...ORG_MEMBER,
  PermissionKey.pam_collaborators_create,
  PermissionKey.pam_collaborators_update,
  PermissionKey.pam_collaborators_delete,
  PermissionKey.pam_environments_delete,
  PermissionKey.pam_project_delete,
  PermissionKey.pam_project_transfer,
  ...TEAM_ADMIN
] as const;

const PLATFORM_USER = [
  PermissionKey.pam_teams_list,
  PermissionKey.pam_teams_create,
  PermissionKey.pam_project_create,
  PermissionKey.pam_project_fork
] as const;

export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<
  string,
  readonly string[]
> = {
  user: [...PLATFORM_USER],
  operator: [...PLATFORM_USER, ...ADMIN_READ],
  admin: [
    ...PLATFORM_USER,
    ...ADMIN_READ,
    ...ADMIN_WRITE,
    ...ADMIN_PERMISSIONS_CATALOG
  ]
};

/** Legacy org keys owner|admin|member — also exposed as team_* via registry. */
export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  member: [...ORG_MEMBER],
  admin: [...ORG_ADMIN],
  owner: [...ORG_ADMIN],
  team_member: [...ORG_MEMBER],
  team_admin: [...ORG_ADMIN],
  team_owner: [...ORG_ADMIN]
};
