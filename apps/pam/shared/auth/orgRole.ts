/**
 * Institution (org) roles for PAM.
 *
 * Product: a PAM **project** is an institution container.
 * Roles owner / admin / member match project access (owner on pam_projects,
 * admin|member on pam_project_collaborators). No parallel org table.
 */

import type { PAMProjectAccessRole } from '@schemas/PAMProjectCollaboratorSchema';

/** Membership roles (excludes `none`). */
export const OrgRole = {
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member'
} as const;

export type OrgRoleType = (typeof OrgRole)[keyof typeof OrgRole];

export const OrgPermission = {
  Read: 'org.read',
  MembersRead: 'org.members.read',
  MembersWrite: 'org.members.write',
  SettingsWrite: 'org.settings.write',
  /** Content / env edit (existing can_edit). */
  ContentWrite: 'org.content.write',
  /**
   * Delete project / destructive manage.
   * PAM currently allows admin+ (same as API asserts); ideal design is owner-only later.
   */
  Delete: 'org.delete'
} as const;

export type OrgPermissionType =
  (typeof OrgPermission)[keyof typeof OrgPermission];

const ROLE_RANK: Record<PAMProjectAccessRole, number> = {
  none: 0,
  member: 1,
  admin: 2,
  owner: 3
};

/** Rank-inclusive permission sets (higher role includes lower). */
const ORG_ROLE_PERMISSIONS: Record<
  OrgRoleType,
  readonly OrgPermissionType[]
> = {
  [OrgRole.Member]: [
    OrgPermission.Read,
    OrgPermission.MembersRead,
    OrgPermission.ContentWrite
  ],
  [OrgRole.Admin]: [
    OrgPermission.Read,
    OrgPermission.MembersRead,
    OrgPermission.MembersWrite,
    OrgPermission.SettingsWrite,
    OrgPermission.ContentWrite,
    OrgPermission.Delete
  ],
  [OrgRole.Owner]: [
    OrgPermission.Read,
    OrgPermission.MembersRead,
    OrgPermission.MembersWrite,
    OrgPermission.SettingsWrite,
    OrgPermission.ContentWrite,
    OrgPermission.Delete
  ]
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

export function expandOrgPermissions(
  role: PAMProjectAccessRole
): readonly OrgPermissionType[] {
  if (role === 'none') {
    return [];
  }
  return ORG_ROLE_PERMISSIONS[role] ?? [];
}

export function hasOrgPermission(
  role: PAMProjectAccessRole,
  permission: OrgPermissionType
): boolean {
  return expandOrgPermissions(role).includes(permission);
}

/**
 * API / UI flags derived from org permissions.
 * Field names keep existing PAM / pamenv contracts.
 */
export function orgAccessFlags(role: PAMProjectAccessRole): {
  my_role: PAMProjectAccessRole;
  is_owner: boolean;
  can_edit: boolean;
  can_manage_collaborators: boolean;
  can_delete: boolean;
  org_permissions: OrgPermissionType[];
} {
  return {
    my_role: role,
    is_owner: role === OrgRole.Owner,
    can_edit: hasOrgPermission(role, OrgPermission.ContentWrite),
    can_manage_collaborators: hasOrgPermission(
      role,
      OrgPermission.MembersWrite
    ),
    can_delete: hasOrgPermission(role, OrgPermission.Delete),
    org_permissions: [...expandOrgPermissions(role)]
  };
}
