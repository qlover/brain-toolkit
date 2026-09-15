/**
 * Default role → permission uid maps (seed / fallback when DB not loaded).
 * Keep in sync with 021 + 022 SQL seeds.
 */

import {
  API_ADMIN_PHONE_OTPS,
  API_ADMIN_REQUEST_LOGS,
  API_ADMIN_ROLES,
  API_ADMIN_SITE_SETTINGS,
  API_ADMIN_USERS,
  API_ADMIN_USERS_PLATFORM_ADMIN,
  API_ADMIN_USERS_SYSTEM_ROLE,
  API_PAM_COLLABORATORS,
  API_PAM_COLLABORATORS_2,
  API_PAM_DELETE,
  API_PAM_EDIT,
  API_PAM_ENVIRONMENTS,
  API_PAM_ENVIRONMENTS_DELETE,
  API_PAM_ENVIRONMENTS_EXPORT,
  API_PAM_ENVIRONMENTS_VARIABLES,
  API_PAM_PREVIEW_IMAGE,
  API_PAM_TEAMS_2,
  API_PAM_TEAMS_MEMBERS,
  API_PAM_TEAMS_MEMBERS_2,
  API_PAM_TEAMS_PROJECTS,
  API_PAM_TRANSFER
} from '@config/apiRoutes';
import { permissionUid } from './permissionUid';

/** Representative uids for legacy UI flags (can_edit / can_manage / can_delete). */
export const OrgFlagUid = {
  Edit: permissionUid('POST', API_PAM_EDIT),
  ManageCollaborators: permissionUid('POST', API_PAM_COLLABORATORS),
  Delete: permissionUid('POST', API_PAM_DELETE)
} as const;

/** Admin console gate (operator+): any user with this uid may open /admin. */
export const SYSTEM_ADMIN_GATE_UID = permissionUid(
  'GET',
  API_ADMIN_SITE_SETTINGS
);

const ADMIN_READ = [
  permissionUid('GET', API_ADMIN_USERS),
  permissionUid('GET', API_ADMIN_ROLES),
  permissionUid('GET', API_ADMIN_REQUEST_LOGS),
  permissionUid('GET', API_ADMIN_PHONE_OTPS),
  permissionUid('GET', API_ADMIN_SITE_SETTINGS)
] as const;

const ADMIN_WRITE = [
  permissionUid('PATCH', API_ADMIN_USERS_PLATFORM_ADMIN),
  permissionUid('PATCH', API_ADMIN_USERS_SYSTEM_ROLE),
  permissionUid('PATCH', API_ADMIN_ROLES),
  permissionUid('PATCH', API_ADMIN_SITE_SETTINGS)
] as const;

const TEAM_MEMBER = [permissionUid('GET', API_PAM_TEAMS_2)] as const;

const TEAM_ADMIN = [
  ...TEAM_MEMBER,
  permissionUid('POST', API_PAM_TEAMS_MEMBERS),
  permissionUid('PATCH', API_PAM_TEAMS_MEMBERS_2),
  permissionUid('DELETE', API_PAM_TEAMS_MEMBERS_2),
  permissionUid('POST', API_PAM_TEAMS_PROJECTS)
] as const;

const ORG_MEMBER = [
  permissionUid('GET', API_PAM_COLLABORATORS),
  permissionUid('POST', API_PAM_ENVIRONMENTS),
  permissionUid('POST', API_PAM_ENVIRONMENTS_VARIABLES),
  permissionUid('GET', API_PAM_ENVIRONMENTS_EXPORT),
  permissionUid('POST', API_PAM_EDIT),
  permissionUid('POST', API_PAM_PREVIEW_IMAGE),
  ...TEAM_MEMBER
] as const;

const ORG_ADMIN = [
  ...ORG_MEMBER,
  permissionUid('POST', API_PAM_COLLABORATORS),
  permissionUid('PATCH', API_PAM_COLLABORATORS_2),
  permissionUid('DELETE', API_PAM_COLLABORATORS_2),
  permissionUid('POST', API_PAM_ENVIRONMENTS_DELETE),
  permissionUid('POST', API_PAM_DELETE),
  permissionUid('POST', API_PAM_TRANSFER),
  ...TEAM_ADMIN
] as const;

export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<
  string,
  readonly string[]
> = {
  user: [],
  operator: [...ADMIN_READ],
  admin: [...ADMIN_READ, ...ADMIN_WRITE]
};

export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  member: [...ORG_MEMBER],
  admin: [...ORG_ADMIN],
  owner: [...ORG_ADMIN]
};
