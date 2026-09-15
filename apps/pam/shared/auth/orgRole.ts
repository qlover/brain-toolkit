/**
 * Institution (org) roles for PAM.
 *
 * Institution = team (`pam_role_teams` / `pam_role_team_members`).
 * Project access prefers `pam_projects.team_id` membership; falls back to
 * project owner + `pam_project_collaborators` when team_id is null.
 *
 * Permission identifiers are immutable API uids (method_path).
 */

import type { PAMProjectAccessRole } from '@schemas/PAMProjectCollaboratorSchema';
import { OrgFlagUid } from './permissionDefaults';
import { resolveOrgPermissions } from './permissionRegistry';

/** Membership roles (excludes `none`). */
export const OrgRole = {
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member'
} as const;

export type OrgRoleType = (typeof OrgRole)[keyof typeof OrgRole];

const ROLE_RANK: Record<PAMProjectAccessRole, number> = {
  none: 0,
  member: 1,
  admin: 2,
  owner: 3
};

export function orgRoleRank(role: PAMProjectAccessRole): number {
  return ROLE_RANK[role] ?? 0;
}

export function hasMinOrgRole(
  role: PAMProjectAccessRole,
  minRole: OrgRoleType
): boolean {
  return orgRoleRank(role) >= orgRoleRank(minRole);
}

/** Expand org role to API permission uids. */
export function expandOrgPermissions(
  role: PAMProjectAccessRole
): readonly string[] {
  if (role === 'none') {
    return [];
  }
  return resolveOrgPermissions(role);
}

export function hasOrgPermission(
  role: PAMProjectAccessRole,
  permissionUid: string
): boolean {
  return expandOrgPermissions(role).includes(permissionUid);
}

/**
 * API / UI flags derived from org permission uids.
 * `permissions` is the uid array for FE includes checks.
 */
export function orgAccessFlags(role: PAMProjectAccessRole): {
  my_role: PAMProjectAccessRole;
  is_owner: boolean;
  can_edit: boolean;
  can_manage_collaborators: boolean;
  can_delete: boolean;
  /** @deprecated Prefer `permissions` */
  org_permissions: string[];
  permissions: string[];
} {
  const permissions = [...expandOrgPermissions(role)];
  return {
    my_role: role,
    is_owner: role === OrgRole.Owner,
    can_edit: hasOrgPermission(role, OrgFlagUid.Edit),
    can_manage_collaborators: hasOrgPermission(
      role,
      OrgFlagUid.ManageCollaborators
    ),
    can_delete: hasOrgPermission(role, OrgFlagUid.Delete),
    org_permissions: permissions,
    permissions
  };
}
