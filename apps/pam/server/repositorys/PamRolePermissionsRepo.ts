import { SupabaseRepo } from '@qlover/next-kit/server';
import type { RoleKindType } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { resetAdminSupabaseClient } from '@shared/supabase/server';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';

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
    @inject(MemoryKvCacheService)
    protected readonly kv: MemoryKvCacheService
  ) {}

  public async listRoles(): Promise<PamRoleRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .order('kind', { ascending: true })
      .order('key', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    const rows = (result.data ?? []) as PamRoleRow[];
    if (rows.length > 0) {
      return rows;
    }

    // Fallback: admin client may have been polluted by auth.refreshSession
    // (user JWT + RLS → []). Raw service_role REST still sees rows.
    const url = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (url && serviceKey) {
      resetAdminSupabaseClient();

      const res = await fetch(
        `${url}/rest/v1/${ROLES_TABLE}?select=id,key,name,kind,description,is_system&order=kind.asc,key.asc`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Accept: 'application/json'
          },
          cache: 'no-store'
        }
      );
      if (res.ok) {
        const raw = (await res.json()) as PamRoleRow[];
        if (Array.isArray(raw) && raw.length > 0) {
          return raw;
        }
      } else {
        const body = await res.text();
        throw new Error(
          `pam_roles empty via supabase-js; raw REST also failed HTTP ${res.status}: ${body.slice(0, 200)}`
        );
      }
    }

    return rows;
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
    const result = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .eq('id', roleId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    const row = (result.data as PamRoleRow | null) ?? null;
    if (row) {
      await this.rememberRoleMapping(row.id, row.key);
    }
    return row;
  }

  public async findRoleByKey(key: string): Promise<PamRoleRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(ROLES_TABLE)
      .select('id, key, name, kind, description, is_system')
      .eq('key', key)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    const row = (result.data as PamRoleRow | null) ?? null;
    if (row) {
      await this.rememberRoleMapping(row.id, row.key);
    }
    return row;
  }

  public async requireRoleIdByKey(key: string): Promise<string> {
    let maps = await this.ensureRoleMaps();
    let id = maps.byKey[key];
    if (!id) {
      // 可能被 rememberRoleMapping 写成「半份」map，强制重载全表。
      await this.invalidateRoleCache();
      maps = await this.ensureRoleMaps();
      id = maps.byKey[key];
    }
    if (!id) {
      const row = await this.findRoleByKey(key);
      if (!row) {
        throw new Error(`Unknown pam_roles.key: ${key}`);
      }
      return row.id;
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
    const cached = await this.kv.getItem<RoleIdKeyMaps>(ROLE_MAPS_KV_KEY);
    if (cached && Object.keys(cached.byKey).length > 0) {
      return cached;
    }
    if (cached) {
      await this.invalidateRoleCache();
    }

    const rows = await this.listRoles();
    const maps = mapsFromRows(rows);
    if (Object.keys(maps.byKey).length === 0) {
      const dbHint = process.env.SUPABASE_URL ?? '(SUPABASE_URL unset)';
      throw new Error(
        `pam_roles is empty (0 rows via admin client @ ${dbHint}). ` +
          'Run apps/pam/makes/sql/000-pam-full-schema.sql on a fresh/dev DB, ' +
          'or INSERT the system role seeds into public.pam_roles on this project.'
      );
    }
    await this.kv.setItem(ROLE_MAPS_KV_KEY, maps, {
      ttlMs: ROLE_MAPS_TTL_MS
    });
    return maps;
  }

  protected async rememberRoleMapping(id: string, key: string): Promise<void> {
    const current = await this.kv.getItem<RoleIdKeyMaps>(ROLE_MAPS_KV_KEY);
    // 禁止在全量 map 尚未建立时写入「只有一条」的半份缓存。
    if (!current || Object.keys(current.byKey).length === 0) {
      return;
    }
    current.byId[id] = key;
    current.byKey[key] = id;
    await this.kv.setItem(ROLE_MAPS_KV_KEY, current, {
      ttlMs: ROLE_MAPS_TTL_MS
    });
  }

  public async listAllRolePermissions(): Promise<PamRoleAssignmentJoinRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .select('role_id, permission_key, pam_roles ( id, key, kind )');
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as unknown as PamRoleAssignmentJoinRow[];
  }

  public async listPermissions(): Promise<PamPermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PERMISSIONS_TABLE)
      .select('permission_key, type, method, path, description')
      .order('permission_key', { ascending: true });
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as PamPermissionRow[];
  }

  public async findPermissionByKey(
    permissionKey: string
  ): Promise<PamPermissionRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PERMISSIONS_TABLE)
      .select('permission_key, type, method, path, description')
      .eq('permission_key', permissionKey)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamPermissionRow | null) ?? null;
  }

  public async insertPermission(input: {
    permissionKey: string;
    type: string;
    method: string | null;
    path: string | null;
    description: string | null;
  }): Promise<PamPermissionRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
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
    this.supabaseBridge.throwIfError(result);

    return result.data as PamPermissionRow;
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
    const result = await supabase
      .from(PERMISSIONS_TABLE)
      .update(patch)
      .eq('permission_key', input.permissionKey)
      .select('permission_key, type, method, path, description')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamPermissionRow;
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const uniqueKeys = [...new Set(input.permissionKeys)];

    const deleteResult = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .delete()
      .eq('role_id', input.roleId);
    this.supabaseBridge.throwIfError(deleteResult);

    if (uniqueKeys.length === 0) {
      return;
    }

    const rows = uniqueKeys.map((permission_key) => ({
      role_id: input.roleId,
      permission_key
    }));

    const insertResult = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .insert(rows);
    this.supabaseBridge.throwIfError(insertResult);
  }
}
