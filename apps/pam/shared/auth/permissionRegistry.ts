/**
 * In-memory role → permission uid maps.
 * Hydrated from pam_role_assignments when available; otherwise code defaults.
 */

import {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS
} from './permissionDefaults';

type StringMap = Record<string, readonly string[]>;

let systemMaps: StringMap | null = null;
let orgMaps: StringMap | null = null;

export function setPermissionMaps(input: {
  system?: StringMap;
  org?: StringMap;
}): void {
  if (input.system) {
    systemMaps = input.system;
  }
  if (input.org) {
    orgMaps = input.org;
  }
}

export function clearPermissionMaps(): void {
  systemMaps = null;
  orgMaps = null;
}

export function arePermissionMapsLoaded(): boolean {
  return systemMaps != null && orgMaps != null;
}

export function resolveSystemPermissions(role: string): readonly string[] {
  return systemMaps?.[role] ?? DEFAULT_SYSTEM_ROLE_PERMISSIONS[role] ?? [];
}

export function resolveOrgPermissions(role: string): readonly string[] {
  return orgMaps?.[role] ?? DEFAULT_ORG_ROLE_PERMISSIONS[role] ?? [];
}
