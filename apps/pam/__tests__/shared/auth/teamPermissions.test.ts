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

  it('team admin can manage members', () => {
    expect(
      hasOrgPermission('admin', PermissionKey.pam_teams_members_create)
    ).toBe(true);
    expect(
      hasOrgPermission('owner', PermissionKey.pam_teams_members_create)
    ).toBe(true);
  });
});
