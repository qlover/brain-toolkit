/**
 * Flat role keys (pam_roles.key).
 * Platform keys bind on pam_users; team keys bind on pam_role_team_members.
 *
 * Never hardcode role UUIDs — resolve id ↔ key from pam_roles at runtime.
 */

export const RoleKind = {
  Platform: 'platform',
  Team: 'team'
} as const;

export type RoleKindType = (typeof RoleKind)[keyof typeof RoleKind];

export const PlatformRoleKey = {
  User: 'user',
  Operator: 'operator',
  Admin: 'admin'
} as const;

export type PlatformRoleKeyType =
  (typeof PlatformRoleKey)[keyof typeof PlatformRoleKey];

export const TeamRoleKey = {
  Owner: 'team_owner',
  Admin: 'team_admin',
  Member: 'team_member'
} as const;

export type TeamRoleKeyType = (typeof TeamRoleKey)[keyof typeof TeamRoleKey];

/** Legacy API / membership text → pam_roles.key */
export function teamRoleKeyFromLegacy(
  role: 'owner' | 'admin' | 'member'
): TeamRoleKeyType {
  if (role === 'owner') return TeamRoleKey.Owner;
  if (role === 'admin') return TeamRoleKey.Admin;
  return TeamRoleKey.Member;
}

export function legacyTeamRoleFromKey(
  key: string | null | undefined
): 'owner' | 'admin' | 'member' | null {
  if (key === TeamRoleKey.Owner || key === 'owner') return 'owner';
  if (key === TeamRoleKey.Admin || key === 'admin') return 'admin';
  if (key === TeamRoleKey.Member || key === 'member') return 'member';
  return null;
}

export function isPlatformRoleKey(
  value: unknown
): value is PlatformRoleKeyType {
  return (
    value === PlatformRoleKey.User ||
    value === PlatformRoleKey.Operator ||
    value === PlatformRoleKey.Admin
  );
}
