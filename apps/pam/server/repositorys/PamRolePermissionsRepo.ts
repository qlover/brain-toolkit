import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { LoggerInterface } from '@qlover/logger';

const PERMISSIONS_TABLE = 'pam_role_permissions';
const ROLE_ASSIGNMENTS_TABLE = 'pam_role_assignments';

export type PermissionScope = 'system' | 'org';

export type PamPermissionRow = {
  uid: string;
  slug: string | null;
  type: string;
  method: string;
  path: string;
  description: string | null;
};

export type PamRolePermissionRow = {
  scope: PermissionScope;
  role_key: string;
  permission_uid: string;
};

@injectable()
export class PamRolePermissionsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async listAllRolePermissions(): Promise<PamRolePermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .select('scope, role_key, permission_uid');

    if (error) {
      this.logger.error('listAllRolePermissions failed', error);
      throw error;
    }

    return (data ?? []) as PamRolePermissionRow[];
  }

  public async listPermissions(): Promise<PamPermissionRow[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(PERMISSIONS_TABLE)
      .select('uid, slug, type, method, path, description');

    if (error) {
      // Older DBs may lack slug column — fall back without it.
      if (error.message?.includes('slug') || error.code === '42703') {
        const fallback = await supabase
          .from(PERMISSIONS_TABLE)
          .select('uid, type, method, path, description');
        if (fallback.error) {
          this.logger.error('listPermissions failed', fallback.error);
          throw fallback.error;
        }
        return (fallback.data ?? []).map((row) => ({
          ...(row as Omit<PamPermissionRow, 'slug'>),
          slug: null
        }));
      }
      this.logger.error('listPermissions failed', error);
      throw error;
    }

    return (data ?? []) as PamPermissionRow[];
  }

  /**
   * Replace all assignments for one (scope, role_key).
   * Empty permissionUids clears the role's grants.
   */
  public async replaceRoleAssignments(input: {
    scope: PermissionScope;
    roleKey: string;
    permissionUids: string[];
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const uniqueUids = [...new Set(input.permissionUids)];

    const { error: deleteError } = await supabase
      .from(ROLE_ASSIGNMENTS_TABLE)
      .delete()
      .eq('scope', input.scope)
      .eq('role_key', input.roleKey);

    if (deleteError) {
      this.logger.error('replaceRoleAssignments delete failed', deleteError);
      throw deleteError;
    }

    if (uniqueUids.length === 0) {
      return;
    }

    const rows = uniqueUids.map((permission_uid) => ({
      scope: input.scope,
      role_key: input.roleKey,
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
