import type { PAMProjectAccessRole } from '@schemas/PAMProjectCollaboratorSchema';

const ROLE_RANK: Record<PAMProjectAccessRole, number> = {
  none: 0,
  member: 1,
  admin: 2,
  owner: 3
};

export function projectAccessRoleRank(role: PAMProjectAccessRole): number {
  return ROLE_RANK[role] ?? 0;
}

export function hasMinProjectAccess(
  role: PAMProjectAccessRole,
  minRole: Exclude<PAMProjectAccessRole, 'none'>
): boolean {
  return projectAccessRoleRank(role) >= projectAccessRoleRank(minRole);
}

export function projectAccessFlags(role: PAMProjectAccessRole): {
  my_role: PAMProjectAccessRole;
  is_owner: boolean;
  can_edit: boolean;
  can_manage_collaborators: boolean;
} {
  return {
    my_role: role,
    is_owner: role === 'owner',
    can_edit: hasMinProjectAccess(role, 'member'),
    can_manage_collaborators: hasMinProjectAccess(role, 'admin')
  };
}
