/**
 * In-memory role_key → permission uid maps (flat).
 * Hydrated from pam_role_assignments (+ pam_roles) when available.
 */

import {
  PermissionRegistry,
  type RolePermissionMap
} from '@brain-toolkit/next-app-kit/shared';
import {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS
} from './permissionDefaults';
import { TeamRoleKey, teamRoleKeyFromLegacy } from './roleKeys';

/** Process-wide registry shared by server IOC instances. */
export const pamPermissionRegistry = new PermissionRegistry({
  defaults: {
    ...DEFAULT_SYSTEM_ROLE_PERMISSIONS,
    [TeamRoleKey.Owner]: DEFAULT_ORG_ROLE_PERMISSIONS.owner ?? [],
    [TeamRoleKey.Admin]: DEFAULT_ORG_ROLE_PERMISSIONS.admin ?? [],
    [TeamRoleKey.Member]: DEFAULT_ORG_ROLE_PERMISSIONS.member ?? []
  },
  aliases: {
    owner: TeamRoleKey.Owner,
    member: TeamRoleKey.Member
  }
});

export function setPermissionMaps(input: {
  /** @deprecated prefer `roles` */
  system?: RolePermissionMap;
  /** @deprecated prefer `roles` */
  org?: RolePermissionMap;
  roles?: RolePermissionMap;
}): void {
  if (input.roles) {
    pamPermissionRegistry.setRoleMaps(input.roles);
    return;
  }
  const next: Record<string, readonly string[]> = { ...input.system };
  for (const [key, uids] of Object.entries(input.org ?? {})) {
    if (key === 'owner' || key === 'admin' || key === 'member') {
      next[teamRoleKeyFromLegacy(key)] = uids;
    } else {
      next[key] = uids;
    }
  }
  pamPermissionRegistry.setRoleMaps(next);
}

export function clearPermissionMaps(): void {
  pamPermissionRegistry.clear();
}

export function arePermissionMapsLoaded(): boolean {
  return pamPermissionRegistry.isLoaded();
}

export function resolveRolePermissions(roleKey: string): readonly string[] {
  return pamPermissionRegistry.resolve(roleKey);
}

export function resolveSystemPermissions(role: string): readonly string[] {
  return resolveRolePermissions(role);
}

export function resolveOrgPermissions(role: string): readonly string[] {
  if (role === 'none') {
    return [];
  }
  if (role === 'owner' || role === 'admin' || role === 'member') {
    return resolveRolePermissions(teamRoleKeyFromLegacy(role));
  }
  return resolveRolePermissions(role);
}
