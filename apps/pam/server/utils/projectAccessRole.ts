/**
 * Project access helpers.
 *
 * Alias of institution (org) roles: PAM project === org container.
 * Prefer importing from `@shared/auth/orgRole` for new code.
 */

import {
  hasMinOrgRole,
  orgAccessFlags,
  orgRoleRank,
  type OrgRoleType
} from '@shared/auth/orgRole';
import type { PAMProjectAccessRole } from '@schemas/PAMProjectCollaboratorSchema';

export function projectAccessRoleRank(role: PAMProjectAccessRole): number {
  return orgRoleRank(role);
}

export function hasMinProjectAccess(
  role: PAMProjectAccessRole,
  minRole: Exclude<PAMProjectAccessRole, 'none'>
): boolean {
  return hasMinOrgRole(role, minRole as OrgRoleType);
}

export function projectAccessFlags(role: PAMProjectAccessRole): {
  my_role: PAMProjectAccessRole;
  is_owner: boolean;
  can_edit: boolean;
  can_manage_collaborators: boolean;
  can_delete: boolean;
  /** @deprecated Prefer `permissions` */
  org_permissions: string[];
  permissions: string[];
} {
  return orgAccessFlags(role);
}
