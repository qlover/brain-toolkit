import {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  DEFAULT_SYSTEM_ROLE_PERMISSIONS
} from '@shared/auth/permissionDefaults';
import {
  arePermissionMapsLoaded,
  clearPermissionMaps,
  setPermissionMaps
} from '@shared/auth/permissionRegistry';
import { permissionSlug } from '@shared/auth/permissionUid';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  PamAdminPermissionItem,
  PamAdminRolesResponse,
  PamPermissionScope
} from '@schemas/PamRoleSchema';
import { PamRolePermissionsRepo } from '../repositorys/PamRolePermissionsRepo';
import type { LoggerInterface } from '@qlover/logger';

function groupByScopeRole(
  rows: Array<{
    scope: string;
    role_key: string;
    permission_uid: string;
  }>
): { system: Record<string, string[]>; org: Record<string, string[]> } {
  const system: Record<string, string[]> = {
    user: [],
    operator: [],
    admin: []
  };
  const org: Record<string, string[]> = {
    member: [],
    admin: [],
    owner: []
  };

  for (const row of rows) {
    const target = row.scope === 'system' ? system : org;
    if (!target[row.role_key]) {
      target[row.role_key] = [];
    }
    if (!target[row.role_key].includes(row.permission_uid)) {
      target[row.role_key].push(row.permission_uid);
    }
  }

  return { system, org };
}

function cloneDefaults(): {
  system: Record<string, string[]>;
  org: Record<string, string[]>;
} {
  const system: Record<string, string[]> = {};
  for (const [key, uids] of Object.entries(DEFAULT_SYSTEM_ROLE_PERMISSIONS)) {
    system[key] = [...uids];
  }
  const org: Record<string, string[]> = {};
  for (const [key, uids] of Object.entries(DEFAULT_ORG_ROLE_PERMISSIONS)) {
    org[key] = [...uids];
  }
  return { system, org };
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

  /**
   * Load pam_role_assignments into the shared in-memory registry once.
   * Falls back to code defaults if the table is missing / empty / errors.
   */
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

  /** Clear in-memory maps and reload from DB (after admin edits). */
  public async reload(): Promise<void> {
    clearPermissionMaps();
    this.loadPromise = null;
    await this.ensureLoaded();
  }

  public async getAdminRolesView(): Promise<PamAdminRolesResponse> {
    let catalog: PamAdminPermissionItem[] = [];
    try {
      const rows = await this.repo.listPermissions();
      catalog = rows.map((row) => ({
        uid: row.uid,
        slug: row.slug?.trim() || permissionSlug(row.uid),
        type: row.type,
        method: row.method,
        path: row.path,
        description: row.description
      }));
    } catch (error) {
      this.logger.warn('listPermissions failed for admin roles view', error);
    }

    let maps = cloneDefaults();
    try {
      const rows = await this.repo.listAllRolePermissions();
      if (rows.length > 0) {
        maps = groupByScopeRole(rows);
      }
    } catch (error) {
      this.logger.warn(
        'listAllRolePermissions failed for admin roles view; using defaults',
        error
      );
    }

    return {
      catalog,
      system: maps.system,
      org: maps.org
    };
  }

  public async replaceRoleAssignments(input: {
    scope: PamPermissionScope;
    roleKey: string;
    permissionUids: string[];
  }): Promise<PamAdminRolesResponse> {
    await this.repo.replaceRoleAssignments({
      scope: input.scope,
      roleKey: input.roleKey,
      permissionUids: input.permissionUids
    });
    await this.reload();
    return this.getAdminRolesView();
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
      const maps = groupByScopeRole(rows);
      setPermissionMaps(maps);
      this.logger.info('Permission maps loaded from pam_role_assignments', {
        systemRoles: Object.keys(maps.system).length,
        orgRoles: Object.keys(maps.org).length,
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
