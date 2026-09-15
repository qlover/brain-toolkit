/**
 * In-memory role_key → permission uid maps (flat).
 * Hydrated from pam_role_assignments (+ pam_roles) when available.
 */

import {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS
} from './permissionDefaults';
import { TeamRoleKey, teamRoleKeyFromLegacy } from './roleKeys';

type StringMap = Record<string, readonly string[]>;

let roleMaps: StringMap | null = null;

export function setPermissionMaps(input: {
  /** @deprecated prefer `roles` */
  system?: StringMap;
  /** @deprecated prefer `roles` */
  org?: StringMap;
  roles?: StringMap;
}): void {
  if (input.roles) {
    roleMaps = { ...input.roles };
    return;
  }
  const next: StringMap = {};
  if (input.system) {
    Object.assign(next, input.system);
  }
  if (input.org) {
    for (const [key, uids] of Object.entries(input.org)) {
      if (key === 'owner' || key === 'admin' || key === 'member') {
        next[teamRoleKeyFromLegacy(key)] = uids;
      } else {
        next[key] = uids;
      }
    }
  }
  roleMaps = next;
}

export function clearPermissionMaps(): void {
  roleMaps = null;
}

export function arePermissionMapsLoaded(): boolean {
  return roleMaps != null;
}

export function resolveRolePermissions(roleKey: string): readonly string[] {
  if (roleMaps?.[roleKey]) {
    return roleMaps[roleKey];
  }
  if (roleKey in DEFAULT_SYSTEM_ROLE_PERMISSIONS) {
    return DEFAULT_SYSTEM_ROLE_PERMISSIONS[roleKey] ?? [];
  }
  if (roleKey === TeamRoleKey.Owner || roleKey === 'owner') {
    return (
      roleMaps?.[TeamRoleKey.Owner] ?? DEFAULT_ORG_ROLE_PERMISSIONS.owner ?? []
    );
  }
  if (roleKey === TeamRoleKey.Admin || roleKey === 'admin') {
    // Prefer team_admin over platform admin when resolving team context
    if (roleMaps?.[TeamRoleKey.Admin]) {
      return roleMaps[TeamRoleKey.Admin];
    }
    return DEFAULT_ORG_ROLE_PERMISSIONS.admin ?? [];
  }
  if (roleKey === TeamRoleKey.Member || roleKey === 'member') {
    return (
      roleMaps?.[TeamRoleKey.Member] ??
      DEFAULT_ORG_ROLE_PERMISSIONS.member ??
      []
    );
  }
  return [];
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
