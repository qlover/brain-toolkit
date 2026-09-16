import { describe, expect, it, beforeEach } from 'vitest';
import { hasOrgPermission } from '@shared/auth/orgRole';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { clearPermissionMaps } from '@shared/auth/permissionRegistry';

describe('teamPermissions', () => {
  beforeEach(() => {
    clearPermissionMaps();
  });

  it('team member can read team but not manage members', () => {
    expect(hasOrgPermission('member', PermissionKey.pam_teams_read)).toBe(true);
    expect(
      hasOrgPermission('member', PermissionKey.pam_teams_members_create)
    ).toBe(false);
  });

  it('team member can read environments but not delete them', () => {
    expect(
      hasOrgPermission('member', PermissionKey.pam_environments_read)
    ).toBe(true);
    expect(
      hasOrgPermission('member', PermissionKey.pam_environments_delete)
    ).toBe(false);
  });

  it('only team owner can dissolve a team', () => {
    expect(hasOrgPermission('owner', PermissionKey.pam_teams_delete)).toBe(
      true
    );
    expect(hasOrgPermission('admin', PermissionKey.pam_teams_delete)).toBe(
      false
    );
    expect(hasOrgPermission('member', PermissionKey.pam_teams_delete)).toBe(
      false
    );
  });
});
