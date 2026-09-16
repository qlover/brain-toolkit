import {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS
} from '@shared/auth/permissionDefaults';
import {
  arePermissionMapsLoaded,
  clearPermissionMaps,
  setPermissionMaps
} from '@shared/auth/permissionRegistry';
import { RoleKind } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  PamAdminPermissionCreate,
  PamAdminPermissionItem,
  PamAdminPermissionUpdate,
  PamAdminPermissionsResponse,
  PamAdminRoleItem,
  PamAdminRolesResponse
} from '@schemas/PamRoleSchema';
import {
  PamRolePermissionsRepo,
  type PamPermissionRow,
  type PamRoleAssignmentJoinRow,
  type PamRoleRow
} from '../repositorys/PamRolePermissionsRepo';
import type { LoggerInterface } from '@qlover/logger';

function assignmentRoleKey(row: PamRoleAssignmentJoinRow): string | null {
  return row.pam_roles?.key ?? null;
}

function mapsFromAssignmentRows(
  rows: PamRoleAssignmentJoinRow[]
): Record<string, string[]> {
  const maps: Record<string, string[]> = {};
  for (const row of rows) {
    const key = assignmentRoleKey(row);
    if (!key) continue;
    if (!maps[key]) maps[key] = [];
    if (!maps[key].includes(row.permission_key)) {
      maps[key].push(row.permission_key);
    }
  }
  return maps;
}

function defaultRoleMaps(): Record<string, string[]> {
  const maps: Record<string, string[]> = {};
  for (const [key, keys] of Object.entries(DEFAULT_SYSTEM_ROLE_PERMISSIONS)) {
    maps[key] = [...keys];
  }
  for (const [key, keys] of Object.entries(DEFAULT_ORG_ROLE_PERMISSIONS)) {
    maps[key] = [...keys];
  }
  return maps;
}

function toPermissionItem(row: PamPermissionRow): PamAdminPermissionItem {
  return {
    permissionKey: row.permission_key,
    type: row.type,
    method: row.method,
    path: row.path,
    description: row.description
  };
}

@injectable()
export class PamPermissionService {
  private loadPromise: Promise<void> | null = null;

  constructor(
    @inject(PamRolePermissionsRepo)
    protected readonly repo: PamRolePermissionsRepo,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async ensureLoaded(): Promise<void> {
    if (arePermissionMapsLoaded()) {
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
    clearPermissionMaps();
    this.loadPromise = null;
    await this.ensureLoaded();
  }

  public async getAdminRolesView(): Promise<PamAdminRolesResponse> {
    let catalog: PamAdminPermissionItem[] = [];
    try {
      const rows = await this.repo.listPermissions();
      catalog = rows.map(toPermissionItem);
    } catch (error) {
      this.logger.warn('listPermissions failed for admin roles view', error);
    }

    let roleRows: PamRoleRow[] = [];
    try {
      const listed = await this.repo.listRoles();
      if (listed.length > 0) {
        roleRows = listed;
      }
    } catch (error) {
      this.logger.warn('listRoles failed for admin roles view', error);
    }

    let maps = defaultRoleMaps();
    try {
      const rows = await this.repo.listAllRolePermissions();
      if (rows.length > 0) {
        maps = { ...maps, ...mapsFromAssignmentRows(rows) };
      }
    } catch (error) {
      this.logger.warn(
        'listAllRolePermissions failed for admin roles view; using defaults',
        error
      );
    }

    const roles: PamAdminRoleItem[] = roleRows.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      kind: role.kind,
      description: role.description,
      isSystem: role.is_system,
      permissionKeys: [...(maps[role.key] ?? [])]
    }));

    const system: Record<string, string[]> = {};
    const org: Record<string, string[]> = {};
    for (const role of roles) {
      if (role.kind === RoleKind.Platform) {
        system[role.key] = [...role.permissionKeys];
      } else {
        const legacy = role.key.replace(/^team_/, '');
        org[legacy] = [...role.permissionKeys];
      }
    }

    return { catalog, roles, system, org };
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<PamAdminRolesResponse> {
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

  public async listPermissionCatalog(): Promise<PamAdminPermissionsResponse> {
    const rows = await this.repo.listPermissions();
    return { catalog: rows.map(toPermissionItem) };
  }

  public async createPermission(
    input: PamAdminPermissionCreate
  ): Promise<PamAdminPermissionsResponse> {
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
    input: PamAdminPermissionUpdate
  ): Promise<PamAdminPermissionsResponse> {
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

  private async loadFromDb(): Promise<void> {
    try {
      const rows = await this.repo.listAllRolePermissions();
      if (rows.length === 0) {
        this.logger.warn(
          'pam_role_assignments empty; using code permission defaults'
        );
        return;
      }
      const maps = mapsFromAssignmentRows(rows);
      setPermissionMaps({ roles: maps });
      this.logger.info('Permission maps loaded from pam_role_assignments', {
        roleKeys: Object.keys(maps).length,
        rows: rows.length
      });
    } catch (error) {
      this.logger.warn(
        'Failed to load pam_role_assignments; using code defaults',
        error
      );
    }
  }
}
