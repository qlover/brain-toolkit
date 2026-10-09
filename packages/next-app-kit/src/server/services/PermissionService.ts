import type { RolePermissionsRepository } from '../repositorys/RolePermissionsRepository';
import type {
  PermissionRow,
  RoleAssignmentRow,
  RoleRow
} from '../repositorys/RolePermissionsRepository';
import type {
  PermissionRegistry,
  RolePermissionMap
} from '../../shared/permissions/PermissionRegistry';
import type {
  AdminPermissionCreate,
  AdminPermissionItem,
  AdminPermissionUpdate,
  AdminPermissionsResponse,
  AdminRoleItem,
  AdminRolesResponse
} from '../../shared/permissions/adminRoleSchemas';

export interface PermissionServiceLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
}

export function roleMapsFromAssignmentRows(
  rows: readonly RoleAssignmentRow[]
): Record<string, string[]> {
  const maps: Record<string, string[]> = {};
  for (const row of rows) {
    const key = row.role?.key;
    if (!key) continue;
    if (!maps[key]) maps[key] = [];
    if (!maps[key].includes(row.permission_key)) {
      maps[key].push(row.permission_key);
    }
  }
  return maps;
}

export function toAdminPermissionItem(row: PermissionRow): AdminPermissionItem {
  return {
    permissionKey: row.permission_key,
    type: row.type,
    method: row.method,
    path: row.path,
    description: row.description
  };
}

function cloneRoleMaps(maps: RolePermissionMap): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const [key, keys] of Object.entries(maps)) {
    next[key] = [...keys];
  }
  return next;
}

/**
 * Loads role assignments into a process-level {@link PermissionRegistry} and
 * serves the admin roles / permission catalog APIs.
 */
export abstract class PermissionService<
  Repo extends RolePermissionsRepository = RolePermissionsRepository
> {
  protected abstract readonly registry: PermissionRegistry;

  private loadPromise: Promise<void> | null = null;

  constructor(
    protected readonly repo: Repo,
    protected readonly logger: PermissionServiceLogger
  ) {}

  public getRegistry(): PermissionRegistry {
    return this.registry;
  }

  public async ensureLoaded(): Promise<void> {
    if (this.registry.isLoaded()) {
      return;
    }
    if (!this.loadPromise) {
      this.loadPromise = this.loadFromDb().finally(() => {
        this.loadPromise = null;
      });
    }
    await this.loadPromise;
  }

  public async reload(): Promise<void> {
    this.registry.clear();
    this.loadPromise = null;
    await this.ensureLoaded();
  }

  public async resolveRolePermissions(
    roleKey: string
  ): Promise<readonly string[]> {
    await this.ensureLoaded();
    return this.registry.resolve(roleKey);
  }

  public async getAdminRolesView(): Promise<AdminRolesResponse> {
    let catalog: AdminPermissionItem[] = [];
    try {
      catalog = (await this.repo.listPermissions()).map(toAdminPermissionItem);
    } catch (error) {
      this.logger.warn('listPermissions failed for admin roles view', error);
    }

    let roleRows: RoleRow[] = [];
    try {
      roleRows = await this.repo.listRoles();
    } catch (error) {
      this.logger.warn('listRoles failed for admin roles view', error);
    }

    let maps = cloneRoleMaps(this.registry.getDefaults());
    try {
      const rows = await this.repo.listAllRolePermissions();
      if (rows.length > 0) {
        maps = { ...maps, ...roleMapsFromAssignmentRows(rows) };
      }
    } catch (error) {
      this.logger.warn(
        'listAllRolePermissions failed for admin roles view; using defaults',
        error
      );
    }

    const roles: AdminRoleItem[] = roleRows.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      kind: role.kind,
      description: role.description,
      isSystem: role.is_system,
      permissionKeys: [...(maps[role.key] ?? [])]
    }));

    return { catalog, roles };
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<AdminRolesResponse> {
    const role = await this.repo.findRoleById(input.roleId);
    if (!role) {
      throw new Error(`Role not found: ${input.roleId}`);
    }
    await this.repo.replaceRoleAssignments({
      roleId: role.id,
      permissionKeys: input.permissionKeys
    });
    await this.reload();
    return this.getAdminRolesView();
  }

  public async listPermissionCatalog(): Promise<AdminPermissionsResponse> {
    const rows = await this.repo.listPermissions();
    return { catalog: rows.map(toAdminPermissionItem) };
  }

  public async createPermission(
    input: AdminPermissionCreate
  ): Promise<AdminPermissionsResponse> {
    const existing = await this.repo.findPermissionByKey(input.permissionKey);
    if (existing) {
      throw new Error(`Permission already exists: ${input.permissionKey}`);
    }
    await this.repo.insertPermission({
      permissionKey: input.permissionKey,
      type: input.type,
      method: input.method ?? null,
      path: input.path ?? null,
      description: input.description ?? null
    });
    return this.listPermissionCatalog();
  }

  public async updatePermission(
    input: AdminPermissionUpdate
  ): Promise<AdminPermissionsResponse> {
    const existing = await this.repo.findPermissionByKey(input.permissionKey);
    if (!existing) {
      throw new Error(`Permission not found: ${input.permissionKey}`);
    }
    await this.repo.updatePermission({
      permissionKey: input.permissionKey,
      type: input.type,
      method: input.method,
      path: input.path,
      description: input.description
    });
    return this.listPermissionCatalog();
  }

  protected async loadFromDb(): Promise<void> {
    const table = this.repo.getTables().assignments;
    try {
      const rows = await this.repo.listAllRolePermissions();
      if (rows.length === 0) {
        this.logger.warn(`${table} empty; using code permission defaults`);
        return;
      }
      const maps = roleMapsFromAssignmentRows(rows);
      this.registry.setRoleMaps(maps);
      this.logger.info(`Permission maps loaded from ${table}`, {
        roleKeys: Object.keys(maps).length,
        rows: rows.length
      });
    } catch (error) {
      this.logger.warn(`Failed to load ${table}; using code defaults`, error);
    }
  }
}
