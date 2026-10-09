import { describe, expect, it, vi } from 'vitest';
import {
  PermissionRegistry,
  sessionHasPermission,
  sessionPermissions
} from '../src/shared/permissions';
import { PermissionService } from '../src/server/services/PermissionService';
import { RequirePermissionPluginBase } from '../src/server/plugins/RequirePermissionPluginBase';
import type {
  RoleAssignmentRow,
  RolePermissionsRepository
} from '../src/server/repositorys/RolePermissionsRepository';
import type { BootstrapServerContext } from '@qlover/next-kit/server';

describe('PermissionRegistry', () => {
  const registry = () =>
    new PermissionRegistry({
      defaults: { user: [], admin: ['a', 'b'], team_owner: ['t'] },
      aliases: { owner: 'team_owner' }
    });

  it('falls back to defaults until maps are loaded', () => {
    const r = registry();
    expect(r.isLoaded()).toBe(false);
    expect(r.resolve('admin')).toEqual(['a', 'b']);
    expect(r.resolve('unknown')).toEqual([]);
  });

  it('prefers loaded maps and keeps defaults for missing keys', () => {
    const r = registry();
    r.setRoleMaps({ admin: ['x'] });
    expect(r.isLoaded()).toBe(true);
    expect(r.resolve('admin')).toEqual(['x']);
    expect(r.resolve('team_owner')).toEqual(['t']);
    r.clear();
    expect(r.resolve('admin')).toEqual(['a', 'b']);
  });

  it('resolves aliases', () => {
    const r = registry();
    expect(r.resolve('owner')).toEqual(['t']);
    r.setRoleMaps({ team_owner: ['loaded'] });
    expect(r.has('owner', 'loaded')).toBe(true);
  });
});

describe('sessionHasPermission', () => {
  const resolve = (role: string) => (role === 'admin' ? ['k'] : []);

  it('uses permissions array first', () => {
    expect(sessionHasPermission({ permissions: ['k'] }, 'k', resolve)).toBe(
      true
    );
    expect(sessionHasPermission({ permissions: ['z'] }, 'k', resolve)).toBe(
      false
    );
  });

  it('expands system_role, otherwise returns null', () => {
    expect(sessionHasPermission({ system_role: 'admin' }, 'k', resolve)).toBe(
      true
    );
    expect(sessionHasPermission({ id: '1' }, 'k', resolve)).toBeNull();
    expect(sessionHasPermission(null, 'k', resolve)).toBeNull();
  });

  it('sessionPermissions reads string keys only', () => {
    expect(sessionPermissions({ permissions: ['a', 1, 'b'] })).toEqual([
      'a',
      'b'
    ]);
    expect(sessionPermissions(undefined)).toEqual([]);
  });
});

const ROLE_ID = '00000000-0000-4000-8000-000000000001';

function createRepo(rows: RoleAssignmentRow[]) {
  return {
    getTables: () => ({
      roles: 'r',
      permissions: 'p',
      assignments: 'a'
    }),
    listAllRolePermissions: vi.fn(async () => rows),
    listPermissions: vi.fn(async () => [
      {
        permission_key: 'k',
        type: 'api',
        method: null,
        path: null,
        description: null
      }
    ]),
    listRoles: vi.fn(async () => [
      {
        id: ROLE_ID,
        key: 'admin',
        name: 'Admin',
        kind: 'platform',
        description: null,
        is_system: true
      }
    ]),
    findRoleById: vi.fn(async (id: string) =>
      id === ROLE_ID ? { id: ROLE_ID, key: 'admin' } : null
    ),
    replaceRoleAssignments: vi.fn(async () => undefined)
  } as unknown as RolePermissionsRepository;
}

class TestPermissionService extends PermissionService {
  protected readonly registry = new PermissionRegistry({
    defaults: { admin: ['default_key'] }
  });
}

const logger = { info: vi.fn(), warn: vi.fn() };

describe('PermissionService', () => {
  it('loads assignment rows into the registry once', async () => {
    const repo = createRepo([
      {
        role_id: ROLE_ID,
        permission_key: 'k',
        role: { id: ROLE_ID, key: 'admin', kind: 'platform' }
      }
    ]);
    const service = new TestPermissionService(repo, logger);
    await Promise.all([service.ensureLoaded(), service.ensureLoaded()]);
    expect(repo.listAllRolePermissions).toHaveBeenCalledTimes(1);
    expect(await service.resolveRolePermissions('admin')).toEqual(['k']);
  });

  it('keeps defaults when assignments are empty without re-querying', async () => {
    const repo = createRepo([]);
    const service = new TestPermissionService(repo, logger);
    await service.ensureLoaded();
    await service.ensureLoaded();
    expect(service.getRegistry().isLoaded()).toBe(true);
    expect(repo.listAllRolePermissions).toHaveBeenCalledTimes(1);
    expect(service.getRegistry().resolve('admin')).toEqual(['default_key']);
  });

  it('does not fall back to defaults for a role emptied in the DB', async () => {
    const OTHER_ID = '00000000-0000-4000-8000-000000000002';
    const repo = createRepo([
      {
        role_id: OTHER_ID,
        permission_key: 'k',
        role: { id: OTHER_ID, key: 'user', kind: 'platform' }
      }
    ]);
    const service = new TestPermissionService(repo, logger);
    expect(await service.resolveRolePermissions('admin')).toEqual([]);
    expect((await service.getAdminRolesView()).roles[0]).toMatchObject({
      key: 'admin',
      permissionKeys: []
    });
  });

  it('builds the admin roles view from defaults when DB has no rows', async () => {
    const service = new TestPermissionService(createRepo([]), logger);
    const view = await service.getAdminRolesView();
    expect(view.catalog).toHaveLength(1);
    expect(view.roles[0]).toMatchObject({
      key: 'admin',
      isSystem: true,
      permissionKeys: ['default_key']
    });
  });

  it('rejects replacing assignments of an unknown role', async () => {
    const service = new TestPermissionService(createRepo([]), logger);
    await expect(
      service.replaceRoleAssignments({ roleId: 'nope', permissionKeys: [] })
    ).rejects.toThrow('Role not found');
  });
});

class TestPlugin extends RequirePermissionPluginBase {
  constructor(
    key: string,
    private readonly deps: {
      service: PermissionService;
      user: Record<string, unknown> | null;
      dbPermissions: string[];
    }
  ) {
    super(key);
  }
  protected getPermissionService(): PermissionService {
    return this.deps.service;
  }
  protected async getSessionUser(): Promise<Record<string, unknown> | null> {
    return this.deps.user;
  }
  protected async resolveUserPermissions(): Promise<readonly string[]> {
    return this.deps.dbPermissions;
  }
  protected createNotAuthorizedError(): Error {
    return new Error('denied');
  }
}

describe('RequirePermissionPluginBase', () => {
  const context = {
    parameters: { IOC: vi.fn() }
  } as unknown as BootstrapServerContext;
  const service = () => new TestPermissionService(createRepo([]), logger);

  it('denies without a session user', async () => {
    const plugin = new TestPlugin('k', {
      service: service(),
      user: null,
      dbPermissions: ['k']
    });
    await expect(plugin.onBefore(context)).rejects.toThrow('denied');
  });

  it('trusts session permissions when present', async () => {
    const allow = new TestPlugin('k', {
      service: service(),
      user: { id: '1', permissions: ['k'] },
      dbPermissions: []
    });
    await expect(allow.onBefore(context)).resolves.toBeUndefined();

    const deny = new TestPlugin('k', {
      service: service(),
      user: { id: '1', permissions: ['other'] },
      dbPermissions: ['k']
    });
    await expect(deny.onBefore(context)).rejects.toThrow('denied');
  });

  it('falls back to DB permissions for thin sessions', async () => {
    const allow = new TestPlugin('k', {
      service: service(),
      user: { id: '1' },
      dbPermissions: ['k']
    });
    await expect(allow.onBefore(context)).resolves.toBeUndefined();

    const deny = new TestPlugin('k', {
      service: service(),
      user: { id: '1' },
      dbPermissions: []
    });
    await expect(deny.onBefore(context)).rejects.toThrow('denied');
  });
});
