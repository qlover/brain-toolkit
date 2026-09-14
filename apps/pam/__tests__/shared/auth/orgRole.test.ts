import { describe, expect, it } from 'vitest';
import {
  expandOrgPermissions,
  hasOrgPermission,
  OrgPermission,
  orgAccessFlags
} from '@shared/auth/orgRole';

describe('orgRole (project === institution)', () => {
  it('member can edit content but not manage collaborators', () => {
    expect(hasOrgPermission('member', OrgPermission.ContentWrite)).toBe(true);
    expect(hasOrgPermission('member', OrgPermission.MembersWrite)).toBe(false);
    expect(hasOrgPermission('member', OrgPermission.Delete)).toBe(false);
  });

  it('admin inherits member permissions and can manage/delete', () => {
    expect(hasOrgPermission('admin', OrgPermission.ContentWrite)).toBe(true);
    expect(hasOrgPermission('admin', OrgPermission.MembersWrite)).toBe(true);
    expect(hasOrgPermission('admin', OrgPermission.Delete)).toBe(true);
  });

  it('owner has full org permission set', () => {
    const perms = expandOrgPermissions('owner');
    expect(perms).toContain(OrgPermission.Delete);
    expect(perms).toContain(OrgPermission.MembersWrite);
  });

  it('orgAccessFlags keep PAM flag contracts', () => {
    expect(orgAccessFlags('none')).toMatchObject({
      my_role: 'none',
      is_owner: false,
      can_edit: false,
      can_manage_collaborators: false,
      can_delete: false
    });
    expect(orgAccessFlags('member').can_edit).toBe(true);
    expect(orgAccessFlags('admin').can_manage_collaborators).toBe(true);
    expect(orgAccessFlags('owner').is_owner).toBe(true);
  });
});
