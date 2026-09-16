/**
 * Institution (org) roles for PAM.
 *
 * Institution = team (`pam_role_teams` / `pam_role_team_members`).
 * Project access uses `pam_projects.team_id` membership (plus project owner).
 *
 * Permission identifiers are immutable permission_key values.
 */

import type { PAMProjectAccessRole } from '@schemas/PAMProjectCollaboratorSchema';
import { OrgFlagPermission } from './permissionDefaults';
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

/** Expand org role to permission_key list. */
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
  permissionKey: string
): boolean {
  return expandOrgPermissions(role).includes(permissionKey);
}

/**
 * API / UI flags derived from org permission_keys.
 * `permissions` is the key array for FE includes checks.
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
    can_edit: hasOrgPermission(role, OrgFlagPermission.Edit),
    can_manage_collaborators: hasOrgPermission(
      role,
      OrgFlagPermission.ManageCollaborators
    ),
    can_delete: hasOrgPermission(role, OrgFlagPermission.Delete),
    org_permissions: permissions,
    permissions
  };
}
