import {
  MemoryKvCacheService,
  ROLE_COLUMNS,
  RolePermissionsRepository,
  type PermissionRow,
  type RoleAssignmentRow,
  type RolePermissionsRepositoryConfig,
  type RoleRow
} from '@brain-toolkit/next-app-kit/server';
import { SupabaseRepo } from '@qlover/next-kit/server';
import type { RoleKindType } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { resetAdminSupabaseClient } from '@shared/supabase/server';

export type PamPermissionRow = PermissionRow;

export type PamRoleRow = RoleRow & { kind: RoleKindType };

export type PamRoleAssignmentJoinRow = RoleAssignmentRow;

const PAM_ROLE_PERMISSIONS_CONFIG: RolePermissionsRepositoryConfig = {
  tables: {
    roles: 'pam_roles',
    permissions: 'pam_role_permissions',
    assignments: 'pam_role_assignments'
  },
  roleMapsCacheKey: 'pam:roles:idKeyMaps',
  roleMapsTtlMs: 60_000,
  emptyRolesHint:
    'Run apps/pam/makes/sql/000-pam-full-schema.sql on a fresh/dev DB, ' +
    'or INSERT the system role seeds into public.pam_roles on this project.'
};

@injectable()
export class PamRolePermissionsRepo extends RolePermissionsRepository {
  protected readonly config = PAM_ROLE_PERMISSIONS_CONFIG;

  constructor(
    @inject(SupabaseRepo)
    supabaseBridge: SupabaseRepo<unknown>,
    @inject(MemoryKvCacheService)
    kv: MemoryKvCacheService
  ) {
    super(supabaseBridge, kv);
  }

  /**
   * @override
   */
  public override async listRoles(): Promise<PamRoleRow[]> {
    const rows = (await super.listRoles()) as PamRoleRow[];
    if (rows.length > 0) {
      return rows;
    }

    // Fallback: admin client may have been polluted by auth.refreshSession
    // (user JWT + RLS → []). Raw service_role REST still sees rows.
    const url = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceKey) {
      return rows;
    }
    resetAdminSupabaseClient();

    const { roles } = this.config.tables;
    const select = ROLE_COLUMNS.replace(/\s+/g, '');
    const res = await fetch(
      `${url}/rest/v1/${roles}?select=${select}&order=kind.asc,key.asc`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `${roles} empty via supabase-js; raw REST also failed HTTP ${res.status}: ${body.slice(0, 200)}`
      );
    }
    const raw = (await res.json()) as PamRoleRow[];
    return Array.isArray(raw) && raw.length > 0 ? raw : rows;
  }

  /**
   * @override
   */
  public override async reloadRoles(): Promise<PamRoleRow[]> {
    return (await super.reloadRoles()) as PamRoleRow[];
  }

  /**
   * @override
   */
  public override async findRoleById(
    roleId: string
  ): Promise<PamRoleRow | null> {
    return (await super.findRoleById(roleId)) as PamRoleRow | null;
  }

  /**
   * @override
   */
  public override async findRoleByKey(key: string): Promise<PamRoleRow | null> {
    return (await super.findRoleByKey(key)) as PamRoleRow | null;
  }
}
