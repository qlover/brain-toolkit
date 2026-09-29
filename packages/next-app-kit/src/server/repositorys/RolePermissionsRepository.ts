import type { KvCacheInterface } from '../interfaces/KvCacheInterface';
import type { SupabaseRepo } from '@qlover/next-kit/server';

/**
 * Structural subset of next-kit `SupabaseRepo` (apps may resolve a different
 * next-kit instance than this package, so the class type is not shared).
 */
export type SupabaseAdminBridge = Pick<
  SupabaseRepo<unknown>,
  'getAdminSupabase' | 'throwIfError'
>;

export interface RolePermissionTables {
  /** id / key / name / kind / description / is_system */
  readonly roles: string;
  /** permission_key catalog */
  readonly permissions: string;
  /** role_id + permission_key */
  readonly assignments: string;
}

export interface RolePermissionsRepositoryConfig {
  readonly tables: RolePermissionTables;
  /** KV key for the process-level role id <-> key maps. */
  readonly roleMapsCacheKey: string;
  readonly roleMapsTtlMs?: number;
  /** Appended to the "roles table is empty" error (e.g. which SQL to run). */
  readonly emptyRolesHint?: string;
}

export type RoleRow = {
  id: string;
  key: string;
  name: string;
  kind: string;
  description: string | null;
  is_system: boolean;
};

export type PermissionRow = {
  permission_key: string;
  type: string;
  method: string | null;
  path: string | null;
  description: string | null;
};

export type RoleAssignmentRow = {
  role_id: string;
  permission_key: string;
  role: { id: string; key: string; kind: string } | null;
};

export type RoleIdKeyMaps = {
  byId: Record<string, string>;
  byKey: Record<string, string>;
};

export type PermissionInsertInput = {
  permissionKey: string;
  type: string;
  method: string | null;
  path: string | null;
  description: string | null;
};

export type PermissionUpdateInput = {
  permissionKey: string;
  type?: string;
  method?: string | null;
  path?: string | null;
  description?: string | null;
};

export const ROLE_COLUMNS = 'id, key, name, kind, description, is_system';
export const PERMISSION_COLUMNS =
  'permission_key, type, method, path, description';

const DEFAULT_ROLE_MAPS_TTL_MS = 60_000;

export function roleMapsFromRows(
  rows: ReadonlyArray<{ id: string; key: string }>
): RoleIdKeyMaps {
  const byId: Record<string, string> = {};
  const byKey: Record<string, string> = {};
  for (const row of rows) {
    byId[row.id] = row.key;
    byKey[row.key] = row.id;
  }
  return { byId, byKey };
}

/**
 * Roles / permission catalog / role assignments on three configurable tables
 * (service-role client). Subclasses provide `config` and IOC wiring.
 */
export abstract class RolePermissionsRepository {
  protected abstract readonly config: RolePermissionsRepositoryConfig;

  constructor(
    protected readonly supabaseBridge: SupabaseAdminBridge,
    protected readonly kv: KvCacheInterface
  ) {}

  protected get roleMapsTtlMs(): number {
    return this.config.roleMapsTtlMs ?? DEFAULT_ROLE_MAPS_TTL_MS;
  }

  public getTables(): RolePermissionTables {
    return this.config.tables;
  }

  public async listRoles(): Promise<RoleRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.roles)
      .select(ROLE_COLUMNS)
      .order('kind', { ascending: true })
      .order('key', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as RoleRow[];
  }

  /** Fresh DB read (also refreshes the process-level id/key cache). */
  public async reloadRoles(): Promise<RoleRow[]> {
    await this.invalidateRoleCache();
    const roles = await this.listRoles();
    await this.kv.setItem(
      this.config.roleMapsCacheKey,
      roleMapsFromRows(roles),
      { ttlMs: this.roleMapsTtlMs }
    );
    return roles;
  }

  public async findRoleById(roleId: string): Promise<RoleRow | null> {
    return this.findRoleBy('id', roleId);
  }

  public async findRoleByKey(key: string): Promise<RoleRow | null> {
    return this.findRoleBy('key', key);
  }

  public async requireRoleIdByKey(key: string): Promise<string> {
    let maps = await this.ensureRoleMaps();
    let id = maps.byKey[key];
    if (!id) {
      await this.invalidateRoleCache();
      maps = await this.ensureRoleMaps();
      id = maps.byKey[key];
    }
    if (id) {
      return id;
    }
    const row = await this.findRoleByKey(key);
    if (!row) {
      throw new Error(`Unknown ${this.config.tables.roles}.key: ${key}`);
    }
    return row.id;
  }

  public async getRoleKeyById(
    roleId: string | null | undefined
  ): Promise<string | null> {
    if (!roleId) {
      return null;
    }
    const maps = await this.ensureRoleMaps();
    return maps.byId[roleId] ?? null;
  }

  public async invalidateRoleCache(): Promise<void> {
    await this.kv.removeItem(this.config.roleMapsCacheKey);
  }

  public async listAllRolePermissions(): Promise<RoleAssignmentRow[]> {
    const { roles, assignments } = this.config.tables;
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(assignments)
      .select(`role_id, permission_key, role:${roles} ( id, key, kind )`);
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as unknown as RoleAssignmentRow[];
  }

  public async listPermissions(): Promise<PermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.permissions)
      .select(PERMISSION_COLUMNS)
      .order('permission_key', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as PermissionRow[];
  }

  public async findPermissionByKey(
    permissionKey: string
  ): Promise<PermissionRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.permissions)
      .select(PERMISSION_COLUMNS)
      .eq('permission_key', permissionKey)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PermissionRow | null) ?? null;
  }

  public async insertPermission(
    input: PermissionInsertInput
  ): Promise<PermissionRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.permissions)
      .insert({
        permission_key: input.permissionKey,
        type: input.type,
        method: input.method,
        path: input.path,
        description: input.description
      })
      .select(PERMISSION_COLUMNS)
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PermissionRow;
  }

  public async updatePermission(
    input: PermissionUpdateInput
  ): Promise<PermissionRow> {
    const patch: Record<string, string | null> = {};
    if (input.type !== undefined) patch.type = input.type;
    if (input.method !== undefined) patch.method = input.method;
    if (input.path !== undefined) patch.path = input.path;
    if (input.description !== undefined) patch.description = input.description;

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.permissions)
      .update(patch)
      .eq('permission_key', input.permissionKey)
      .select(PERMISSION_COLUMNS)
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PermissionRow;
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<void> {
    const { assignments } = this.config.tables;
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const uniqueKeys = [...new Set(input.permissionKeys)];

    const deleteResult = await supabase
      .from(assignments)
      .delete()
      .eq('role_id', input.roleId);
    this.supabaseBridge.throwIfError(deleteResult);

    if (uniqueKeys.length === 0) {
      return;
    }

    const insertResult = await supabase.from(assignments).insert(
      uniqueKeys.map((permission_key) => ({
        role_id: input.roleId,
        permission_key
      }))
    );
    this.supabaseBridge.throwIfError(insertResult);
  }

  protected async findRoleBy(
    column: 'id' | 'key',
    value: string
  ): Promise<RoleRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.config.tables.roles)
      .select(ROLE_COLUMNS)
      .eq(column, value)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    const row = (result.data as RoleRow | null) ?? null;
    if (row) {
      await this.rememberRoleMapping(row.id, row.key);
    }
    return row;
  }

  protected async readRoleMaps(): Promise<RoleIdKeyMaps | null> {
    return ((await this.kv.getItem(this.config.roleMapsCacheKey)) ??
      null) as RoleIdKeyMaps | null;
  }

  protected async ensureRoleMaps(): Promise<RoleIdKeyMaps> {
    const { roleMapsCacheKey } = this.config;
    const cached = await this.readRoleMaps();
    if (cached && Object.keys(cached.byKey).length > 0) {
      return cached;
    }
    if (cached) {
      await this.invalidateRoleCache();
    }

    const maps = roleMapsFromRows(await this.listRoles());
    if (Object.keys(maps.byKey).length === 0) {
      throw new Error(
        `${this.config.tables.roles} is empty (0 rows via admin client).` +
          (this.config.emptyRolesHint ? ` ${this.config.emptyRolesHint}` : '')
      );
    }
    await this.kv.setItem(roleMapsCacheKey, maps, {
      ttlMs: this.roleMapsTtlMs
    });
    return maps;
  }

  protected async rememberRoleMapping(id: string, key: string): Promise<void> {
    const { roleMapsCacheKey } = this.config;
    const current = await this.readRoleMaps();
    // Never seed a partial (single-row) cache before the full map exists.
    if (!current || Object.keys(current.byKey).length === 0) {
      return;
    }
    current.byId[id] = key;
    current.byKey[key] = id;
    await this.kv.setItem(roleMapsCacheKey, current, {
      ttlMs: this.roleMapsTtlMs
    });
  }
}
