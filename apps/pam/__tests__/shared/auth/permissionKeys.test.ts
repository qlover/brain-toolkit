import { describe, expect, it, beforeEach } from 'vitest';
import {
  expandOrgPermissions,
  hasOrgPermission,
  orgAccessFlags
} from '@shared/auth/orgRole';
import {
  OrgFlagPermission,
  SYSTEM_ADMIN_GATE_KEY
} from '@shared/auth/permissionDefaults';
import {
  PermissionKey,
  PERMISSION_KEY_PATTERN,
  permissionI18nKey,
  isPermissionKey
} from '@shared/auth/permissionKeys';
import {
  clearPermissionMaps,
  setPermissionMaps,
  resolveOrgPermissions,
  resolveSystemPermissions
} from '@shared/auth/permissionRegistry';
import {
  expandSystemPermissions,
  hasSystemPermission,
  isPlatformAdminRole
} from '@shared/auth/systemRole';

describe('permissionKeys', () => {
  it('uses stable permission_key format', () => {
    expect(PermissionKey.pam_project_create).toBe('pam_project_create');
    expect(PERMISSION_KEY_PATTERN.test(PermissionKey.pam_project_create)).toBe(
      true
    );
    expect(PERMISSION_KEY_PATTERN.test('1bad')).toBe(false);
    expect(isPermissionKey(PermissionKey.admin_roles_read)).toBe(true);
  });

  it('builds i18n key from permission_key', () => {
    expect(permissionI18nKey(PermissionKey.admin_roles_read)).toBe(
      'permission:admin_roles_read'
    );
  });
});

describe('role permission maps', () => {
  beforeEach(() => {
    clearPermissionMaps();
  });

  it('resolves defaults for org and system roles', () => {
    expect(resolveOrgPermissions('member')).toContain(OrgFlagPermission.Edit);
    expect(resolveSystemPermissions('admin')).toContain(SYSTEM_ADMIN_GATE_KEY);
  });

  it('prefers loaded maps over defaults', () => {
    setPermissionMaps({
      org: { member: [OrgFlagPermission.Edit] },
      system: { operator: [SYSTEM_ADMIN_GATE_KEY] }
    });
    expect(resolveOrgPermissions('member')).toEqual([OrgFlagPermission.Edit]);
    expect(resolveSystemPermissions('operator')).toEqual([
      SYSTEM_ADMIN_GATE_KEY
    ]);
  });

  it('derives org access flags from permission_keys', () => {
    expect(hasOrgPermission('member', OrgFlagPermission.Edit)).toBe(true);
    expect(
      hasOrgPermission('member', OrgFlagPermission.ManageCollaborators)
    ).toBe(false);
    expect(hasOrgPermission('member', OrgFlagPermission.Delete)).toBe(false);

    expect(hasOrgPermission('admin', OrgFlagPermission.Edit)).toBe(true);
    expect(
      hasOrgPermission('admin', OrgFlagPermission.ManageCollaborators)
    ).toBe(true);
    expect(hasOrgPermission('admin', OrgFlagPermission.Delete)).toBe(true);

    const flags = orgAccessFlags('owner');
    const perms = expandOrgPermissions('owner');
    expect(perms).toContain(OrgFlagPermission.Delete);
    expect(perms).toContain(OrgFlagPermission.ManageCollaborators);
    expect(flags.can_delete).toBe(true);
    expect(flags.permissions).toEqual([...perms]);
  });

  it('gates platform admin via admin_site_settings_read', () => {
    expect(isPlatformAdminRole('user')).toBe(false);
    expect(isPlatformAdminRole('operator')).toBe(true);
    expect(isPlatformAdminRole('admin')).toBe(true);
    expect(hasSystemPermission('admin', SYSTEM_ADMIN_GATE_KEY)).toBe(true);
    expect(expandSystemPermissions('user')).toContain(
      PermissionKey.pam_project_create
    );
  });
});
