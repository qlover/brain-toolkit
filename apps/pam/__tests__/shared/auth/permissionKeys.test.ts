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
  hasSystemPermission,
  sessionHasSystemPermission
} from '@shared/auth/systemRole';

describe('permissionKeys', () => {
  it('reads platform permission from session without DB', () => {
    expect(
      sessionHasSystemPermission(
        { permissions: [PermissionKey.admin_roles_read] },
        PermissionKey.admin_roles_read
      )
    ).toBe(true);
    expect(
      sessionHasSystemPermission(
        { permissions: [PermissionKey.admin_roles_read] },
        PermissionKey.admin_roles_write
      )
    ).toBe(false);
    expect(
      sessionHasSystemPermission(
        { system_role: 'operator' },
        SYSTEM_ADMIN_GATE_KEY
      )
    ).toBe(true);
    expect(
      sessionHasSystemPermission({ id: 'x' }, PermissionKey.admin_roles_read)
    ).toBe(null);
  });

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
    ).toBe(false);
    expect(hasOrgPermission('admin', OrgFlagPermission.Delete)).toBe(false);

    const flags = orgAccessFlags('owner');
    const perms = expandOrgPermissions('owner');
    expect(perms).toContain(OrgFlagPermission.Delete);
    expect(perms).not.toContain(OrgFlagPermission.ManageCollaborators);
    expect(flags.can_delete).toBe(true);
    expect(flags.can_manage_collaborators).toBe(false);
    expect(flags.permissions).toEqual([...perms]);
  });

  it('grants locales read to operator and write to admin only', () => {
    expect(
      hasSystemPermission('operator', PermissionKey.admin_locales_read)
    ).toBe(true);
    expect(
      hasSystemPermission('operator', PermissionKey.admin_locales_write)
    ).toBe(false);
    expect(hasSystemPermission('admin', PermissionKey.admin_locales_read)).toBe(
      true
    );
    expect(
      hasSystemPermission('admin', PermissionKey.admin_locales_write)
    ).toBe(true);
  });

  it('grants Memory KV inspect only to admin, not operator', () => {
    expect(
      hasSystemPermission('operator', PermissionKey.admin_memory_kv_read)
    ).toBe(false);
    expect(
      hasSystemPermission('operator', PermissionKey.admin_memory_kv_write)
    ).toBe(false);
    expect(
      hasSystemPermission('admin', PermissionKey.admin_memory_kv_read)
    ).toBe(true);
    expect(
      hasSystemPermission('admin', PermissionKey.admin_memory_kv_write)
    ).toBe(true);
  });
});
