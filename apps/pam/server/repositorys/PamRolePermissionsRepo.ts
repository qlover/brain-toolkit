import { SupabaseRepo } from '@qlover/next-kit/server';
import type { RoleKindType } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';
import type { LoggerInterface } from '@qlover/logger';

const ROLES_TABLE = 'pam_roles';
const PERMISSIONS_TABLE = 'pam_role_permissions';
const ROLE_ASSIGNMENTS_TABLE = 'pam_role_assignments';

const ROLE_MAPS_KV_KEY = 'pam:roles:idKeyMaps';
const ROLE_MAPS_TTL_MS = 60_000;

type RoleIdKeyMaps = {
  byId: Record<string, string>;
  byKey: Record<string, string>;
};

export type PamPermissionRow = {
  permission_key: string;
  type: string;
  method: string | null;
  path: string | null;
  description: string | null;
};

export type PamRoleRow = {
  id: string;
  key: string;
  name: string;
  kind: RoleKindType;
  description: string | null;
  is_system: boolean;
};

export type PamRoleAssignmentJoinRow = {
  role_id: string;
  permission_key: string;
  pam_roles: { id: string; key: string; kind: string } | null;
};

function mapsFromRows(
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

@injectable()
export class PamRolePermissionsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface,
    @inject(MemoryKvCacheService)
    protected readonly kv: MemoryKvCacheService
  ) {}

  public async listRoles(): Promise<PamRoleRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .order('kind', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      this.logger.error('listRoles failed', error);
      throw error;
    }

    return (data ?? []) as PamRoleRow[];
  }

  /** Fresh DB read (also refreshes process-level id/key cache via MemoryKv). */
  public async reloadRoles(): Promise<PamRoleRow[]> {
    await this.invalidateRoleCache();
    const roles = await this.listRoles();
    await this.kv.setItem(ROLE_MAPS_KV_KEY, mapsFromRows(roles), {
      ttlMs: ROLE_MAPS_TTL_MS
    });
    return roles;
  }

  public async findRoleById(roleId: string): Promise<PamRoleRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      this.logger.error('findRoleById failed', error);
      throw error;
    }

    const row = (data as PamRoleRow | null) ?? null;
    if (row) {
      await this.rememberRoleMapping(row.id, row.key);
    }
    return row;
  }

  public async findRoleByKey(key: string): Promise<PamRoleRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      this.logger.error('findRoleByKey failed', error);
      throw error;
    }
    const row = (data as PamRoleRow | null) ?? null;
    if (row) {
      await this.rememberRoleMapping(row.id, row.key);
    }
    return row;
  }

  public async requireRoleIdByKey(key: string): Promise<string> {
    const maps = await this.ensureRoleMaps();
    const id = maps.byKey[key];
    if (!id) {
      throw new Error(`Unknown pam_roles.key: ${key}`);
    }
    return id;
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
    await this.kv.removeItem(ROLE_MAPS_KV_KEY);
  }

  protected async ensureRoleMaps(): Promise<RoleIdKeyMaps> {
    return this.kv.getOrSet(
      ROLE_MAPS_KV_KEY,
      async () => mapsFromRows(await this.listRoles()),
      { ttlMs: ROLE_MAPS_TTL_MS }
    );
  }

  protected async rememberRoleMapping(id: string, key: string): Promise<void> {
    const current = (await this.kv.getItem<RoleIdKeyMaps>(
      ROLE_MAPS_KV_KEY
    )) ?? {
      byId: {},
      byKey: {}
    };
    current.byId[id] = key;
    current.byKey[key] = id;
    await this.kv.setItem(ROLE_MAPS_KV_KEY, current, {
      ttlMs: ROLE_MAPS_TTL_MS
    });
  }

  public async listAllRolePermissions(): Promise<PamRoleAssignmentJoinRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .select('role_id, permission_key, pam_roles ( id, key, kind )');

    if (error) {
      this.logger.error('listAllRolePermissions failed', error);
      throw error;
    }

    return (data ?? []) as unknown as PamRoleAssignmentJoinRow[];
  }

  public async listPermissions(): Promise<PamPermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .select('permission_key, type, method, path, description')
      .order('permission_key', { ascending: true });

    if (error) {
      this.logger.error('listPermissions failed', error);
      throw error;
    }

    return (data ?? []) as PamPermissionRow[];
  }

  public async findPermissionByKey(
    permissionKey: string
  ): Promise<PamPermissionRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .select('permission_key, type, method, path, description')
      .eq('permission_key', permissionKey)
      .maybeSingle();

    if (error) {
      this.logger.error('findPermissionByKey failed', error);
      throw error;
    }

    return (data as PamPermissionRow | null) ?? null;
  }

  public async insertPermission(input: {
    permissionKey: string;
    type: string;
    method: string | null;
    path: string | null;
    description: string | null;
  }): Promise<PamPermissionRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .insert({
        permission_key: input.permissionKey,
        type: input.type,
        method: input.method,
        path: input.path,
        description: input.description
      })
      .select('permission_key, type, method, path, description')
      .single();

    if (error) {
      this.logger.error('insertPermission failed', error);
      throw error;
    }

    return data as PamPermissionRow;
  }

  public async updatePermission(input: {
    permissionKey: string;
    type?: string;
    method?: string | null;
    path?: string | null;
    description?: string | null;
  }): Promise<PamPermissionRow> {
    const patch: Record<string, string | null> = {};
    if (input.type !== undefined) patch.type = input.type;
    if (input.method !== undefined) patch.method = input.method;
    if (input.path !== undefined) patch.path = input.path;
    if (input.description !== undefined) patch.description = input.description;

    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .update(patch)
      .eq('permission_key', input.permissionKey)
      .select('permission_key, type, method, path, description')
      .single();

    if (error) {
      this.logger.error('updatePermission failed', error);
      throw error;
    }

    return data as PamPermissionRow;
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const uniqueKeys = [...new Set(input.permissionKeys)];

    const { error: deleteError } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .delete()
      .eq('role_id', input.roleId);

    if (deleteError) {
      this.logger.error('replaceRoleAssignments delete failed', deleteError);
      throw deleteError;
    }

    if (uniqueKeys.length === 0) {
      return;
    }

    const rows = uniqueKeys.map((permission_key) => ({
      role_id: input.roleId,
      permission_key
    }));

    const { error: insertError } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .insert(rows);

    if (insertError) {
      this.logger.error('replaceRoleAssignments insert failed', insertError);
      throw insertError;
    }
  }
}
