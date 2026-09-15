import { SupabaseRepo } from '@qlover/next-kit/server';
import type { RoleKindType } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { LoggerInterface } from '@qlover/logger';

const ROLES_TABLE = 'pam_roles';
const PERMISSIONS_TABLE = 'pam_role_permissions';
const ROLE_ASSIGNMENTS_TABLE = 'pam_role_assignments';

export type PamPermissionRow = {
  uid: string;
  slug: string | null;
  type: string;
  method: string;
  path: string;
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
  permission_uid: string;
  pam_roles: { id: string; key: string; kind: string } | null;
};

@injectable()
export class PamRolePermissionsRepo {
  protected roleByKey = new Map<string, PamRoleRow>();
  protected roleById = new Map<string, PamRoleRow>();
  protected roleCacheLoaded = false;

  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
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

  /** Fresh DB read (also refreshes id/key cache). */
  public async reloadRoles(): Promise<PamRoleRow[]> {
    this.invalidateRoleCache();
    const roles = await this.listRoles();
    for (const role of roles) {
      this.roleByKey.set(role.key, role);
      this.roleById.set(role.id, role);
    }
    this.roleCacheLoaded = true;
    return roles;
  }

  public async findRoleById(roleId: string): Promise<PamRoleRow | null> {
    await this.ensureRoleCache();
    const cached = this.roleById.get(roleId);
    if (cached) {
      return cached;
    }
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
      this.roleByKey.set(row.key, row);
      this.roleById.set(row.id, row);
    }
    return row;
  }

  public async findRoleByKey(key: string): Promise<PamRoleRow | null> {
    await this.ensureRoleCache();
    return this.roleByKey.get(key) ?? null;
  }

  public async requireRoleIdByKey(key: string): Promise<string> {
    const row = await this.findRoleByKey(key);
    if (!row) {
      throw new Error(`Unknown pam_roles.key: ${key}`);
    }
    return row.id;
  }

  public async getRoleKeyById(
    roleId: string | null | undefined
  ): Promise<string | null> {
    if (!roleId) {
      return null;
    }
    await this.ensureRoleCache();
    return this.roleById.get(roleId)?.key ?? null;
  }

  public invalidateRoleCache(): void {
    this.roleByKey.clear();
    this.roleById.clear();
    this.roleCacheLoaded = false;
  }

  protected async ensureRoleCache(): Promise<void> {
    if (this.roleCacheLoaded) {
      return;
    }
    const roles = await this.listRoles();
    this.roleByKey.clear();
    this.roleById.clear();
    for (const role of roles) {
      this.roleByKey.set(role.key, role);
      this.roleById.set(role.id, role);
    }
    this.roleCacheLoaded = true;
  }

  public async listAllRolePermissions(): Promise<PamRoleAssignmentJoinRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .select('role_id, permission_uid, pam_roles ( id, key, kind )');

    if (error) {
      this.logger.error('listAllRolePermissions failed', error);
      throw error;
    }

    return (data ?? []) as PamRoleAssignmentJoinRow[];
  }

  public async listPermissions(): Promise<PamPermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .select('uid, slug, type, method, path, description');

    if (error) {
      this.logger.error('listPermissions failed', error);
      throw error;
    }

    return (data ?? []) as PamPermissionRow[];
  }

  public async replaceRoleAssignments(input: {
    roleId: string;
    permissionUids: string[];
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const uniqueUids = [...new Set(input.permissionUids)];

    const { error: deleteError } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .delete()
      .eq('role_id', input.roleId);

    if (deleteError) {
      this.logger.error('replaceRoleAssignments delete failed', deleteError);
      throw deleteError;
    }

    if (uniqueUids.length === 0) {
      return;
    }

    const rows = uniqueUids.map((permission_uid) => ({
      role_id: input.roleId,
      permission_uid
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
