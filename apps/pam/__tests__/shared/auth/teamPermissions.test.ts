import { describe, expect, it } from 'vitest';
import { expandOrgPermissions, hasOrgPermission } from '@shared/auth/orgRole';
import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_TEAMS_2, API_PAM_TEAMS_MEMBERS } from '@config/apiRoutes';

describe('team org permissions (uid)', () => {
  it('member can read team detail but not manage members', () => {
    expect(
      hasOrgPermission('member', permissionUid('GET', API_PAM_TEAMS_2))
    ).toBe(true);
    expect(
      hasOrgPermission('member', permissionUid('POST', API_PAM_TEAMS_MEMBERS))
    ).toBe(false);
  });

  it('admin/owner can manage team members', () => {
    expect(
      hasOrgPermission('admin', permissionUid('POST', API_PAM_TEAMS_MEMBERS))
    ).toBe(true);
    expect(expandOrgPermissions('owner')).toContain(
      permissionUid('POST', API_PAM_TEAMS_MEMBERS)
    );
  });
});
