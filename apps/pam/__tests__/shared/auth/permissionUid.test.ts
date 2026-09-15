import { describe, expect, it, beforeEach } from 'vitest';
import {
  expandOrgPermissions,
  hasOrgPermission,
  orgAccessFlags
} from '@shared/auth/orgRole';
import {
  OrgFlagUid,
  SYSTEM_ADMIN_GATE_UID
} from '@shared/auth/permissionDefaults';
import {
  clearPermissionMaps,
  setPermissionMaps,
  resolveOrgPermissions,
  resolveSystemPermissions
} from '@shared/auth/permissionRegistry';
import {
  permissionUid,
  permissionSlug,
  permissionI18nKey
} from '@shared/auth/permissionUid';
import {
  expandSystemPermissions,
  hasSystemPermission,
  isPlatformAdminRole
} from '@shared/auth/systemRole';
import { API_PAM_ENVIRONMENTS_DELETE } from '@config/apiRoutes';

describe('permissionUid', () => {
  it('builds immutable method_path uid from API constants', () => {
    expect(permissionUid('POST', API_PAM_ENVIRONMENTS_DELETE)).toBe(
      'post_/api/pam/:projectId/environments/:envId/delete'
    );
    expect(permissionUid('get', '/api/admin/users')).toBe(
      'get_/api/admin/users'
    );
  });

  it('formats uid into i18n slug', () => {
    expect(permissionSlug('get_/api/admin/roles')).toBe('get_api_admin_roles');
    expect(
      permissionSlug('patch_/api/pam/:projectId/collaborators/:userId')
    ).toBe('patch_api_pam_projectId_collaborators_userId');
    expect(permissionI18nKey('get_/api/admin/roles')).toBe(
      'permission:get_api_admin_roles'
    );
    expect(permissionI18nKey('get_api_admin_roles')).toBe(
      'permission:get_api_admin_roles'
    );
  });
});

describe('permissionRegistry (uid maps)', () => {
  beforeEach(() => {
    clearPermissionMaps();
  });

  it('falls back to defaults when not hydrated', () => {
    expect(resolveOrgPermissions('member')).toContain(OrgFlagUid.Edit);
    expect(resolveSystemPermissions('admin')).toContain(SYSTEM_ADMIN_GATE_UID);
  });

  it('uses hydrated maps from DB when set', () => {
    setPermissionMaps({
      org: { member: [OrgFlagUid.Edit] },
      system: { operator: [SYSTEM_ADMIN_GATE_UID] }
    });
    expect(resolveOrgPermissions('member')).toEqual([OrgFlagUid.Edit]);
    expect(resolveSystemPermissions('operator')).toEqual([
      SYSTEM_ADMIN_GATE_UID
    ]);
  });
});

describe('orgRole (API uids)', () => {
  beforeEach(() => {
    clearPermissionMaps();
  });

  it('member can edit but not manage collaborators or delete', () => {
    expect(hasOrgPermission('member', OrgFlagUid.Edit)).toBe(true);
    expect(hasOrgPermission('member', OrgFlagUid.ManageCollaborators)).toBe(
      false
    );
    expect(hasOrgPermission('member', OrgFlagUid.Delete)).toBe(false);
  });

  it('admin inherits member uids and can manage/delete', () => {
    expect(hasOrgPermission('admin', OrgFlagUid.Edit)).toBe(true);
    expect(hasOrgPermission('admin', OrgFlagUid.ManageCollaborators)).toBe(
      true
    );
    expect(hasOrgPermission('admin', OrgFlagUid.Delete)).toBe(true);
  });

  it('owner expand includes delete and manage uids', () => {
    const perms = expandOrgPermissions('owner');
    expect(perms).toContain(OrgFlagUid.Delete);
    expect(perms).toContain(OrgFlagUid.ManageCollaborators);
  });

  it('orgAccessFlags keep PAM flag contracts', () => {
    expect(orgAccessFlags('none')).toMatchObject({
      my_role: 'none',
      is_owner: false,
      can_edit: false,
      can_manage_collaborators: false,
      can_delete: false,
      permissions: []
    });
    expect(orgAccessFlags('member').can_edit).toBe(true);
    expect(orgAccessFlags('admin').can_manage_collaborators).toBe(true);
    expect(orgAccessFlags('owner').is_owner).toBe(true);
    expect(orgAccessFlags('owner').permissions).toEqual(
      orgAccessFlags('owner').org_permissions
    );
  });
});

describe('systemRole (API uids)', () => {
  beforeEach(() => {
    clearPermissionMaps();
  });

  it('operator has admin gate; admin has write uids', () => {
    expect(isPlatformAdminRole('operator')).toBe(true);
    expect(isPlatformAdminRole('user')).toBe(false);
    expect(hasSystemPermission('admin', SYSTEM_ADMIN_GATE_UID)).toBe(true);
    expect(expandSystemPermissions('user')).toEqual([]);
  });
});
