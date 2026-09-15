import { UserRole } from '@qlover/next-kit/common';
import {
  expandSystemPermissions,
  isPlatformAdminRole,
  normalizeSystemRole,
  SystemRole,
  type SystemRoleType
} from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import type {
  PamAdminUserListItem,
  PamSessionUser,
  PamUserRow
} from '@schemas/PamUserSchema';
import { PamRolePermissionsRepo } from '@server/repositorys/PamRolePermissionsRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { PamPermissionService } from '@server/services/PamPermissionService';
import {
  invalidatePlatformAdminCache,
  setPlatformAdminCache
} from '@server/utils/platformAdminCache';

export type PamUserEnsureInput = {
  readonly id: string;
  readonly email: string | null;
  readonly displayName?: string | null;
  readonly phone?: string | null;
};

@injectable()
export class PamUserService {
  constructor(
    @inject(PamUsersRepo) protected readonly repo: PamUsersRepo,
    @inject(PamRolePermissionsRepo)
    protected readonly roles: PamRolePermissionsRepo,
    @inject(PamPermissionService)
    protected readonly permissionService: PamPermissionService
  ) {}

  protected async systemRoleFromUser(
    pam: Pick<PamUserRow, 'role_id'> | null | undefined
  ): Promise<SystemRoleType> {
    const key = await this.roles.getRoleKeyById(pam?.role_id);
    return normalizeSystemRole(key);
  }

  public async ensurePamUser(input: PamUserEnsureInput): Promise<PamUserRow> {
    const row = await this.repo.ensureProfile({
      ...input,
      email: toBusinessEmail(input.email)
    });
    const role = await this.systemRoleFromUser(row);
    setPlatformAdminCache(row.id, isPlatformAdminRole(role));
    return row;
  }

  public async findById(userId: string): Promise<PamUserRow | null> {
    return this.repo.findById(userId);
  }

  public async findByEmail(email: string): Promise<PamUserRow | null> {
    return this.repo.findByEmail(email);
  }

  public async findByPhone(phone: string): Promise<PamUserRow | null> {
    return this.repo.findByPhone(phone);
  }

  public async getSystemRole(userId: string): Promise<SystemRoleType> {
    const row = await this.repo.findById(userId);
    return this.systemRoleFromUser(row);
  }

  /** True when platform role has admin console gate uid (operator or admin). */
  public async isPlatformAdmin(userId: string): Promise<boolean> {
    const role = await this.getSystemRole(userId);
    const allowed = isPlatformAdminRole(role);
    setPlatformAdminCache(userId, allowed);
    return allowed;
  }

  /** Flat session user payload (system_role + permissions on the user object). */
  public async toSessionUser(
    pam: PamUserRow,
    extras?: { role?: number; created_at?: string }
  ): Promise<PamSessionUser> {
    await this.permissionService.ensureLoaded();
    const system_role = await this.systemRoleFromUser(pam);
    return {
      id: pam.id,
      email: pam.email?.trim() ?? '',
      phone: pam.phone ?? null,
      display_name: pam.display_name ?? null,
      role: extras?.role ?? UserRole.USER,
      system_role,
      permissions: [...expandSystemPermissions(system_role)],
      credential_token: '',
      created_at: extras?.created_at ?? pam.created_at
    };
  }

  public async searchAdminUsers(params: {
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<PamAdminUserListItem[]> {
    const rows = await this.repo.searchForAdmin(params);
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      phone: row.phone,
      displayName: row.displayName,
      isPlatformAdmin: row.isPlatformAdmin,
      systemRole: row.systemRole,
      status: row.status as 'active' | 'suspended',
      createdAt: row.createdAt
    }));
  }

  public async setPlatformAdmin(
    targetUserId: string,
    enabled: boolean,
    actorUserId: string
  ): Promise<PamUserRow> {
    return this.setSystemRole(
      targetUserId,
      enabled ? SystemRole.Admin : SystemRole.User,
      actorUserId
    );
  }

  public async setSystemRole(
    targetUserId: string,
    systemRole: SystemRoleType,
    actorUserId: string
  ): Promise<PamUserRow> {
    const row = await this.repo.setSystemRole(
      targetUserId,
      systemRole,
      actorUserId
    );
    invalidatePlatformAdminCache(targetUserId);
    const role = await this.systemRoleFromUser(row);
    setPlatformAdminCache(targetUserId, isPlatformAdminRole(role));
    return row;
  }

  public async updateDisplayName(
    userId: string,
    displayName: string
  ): Promise<PamUserRow> {
    return this.repo.updateEmailAndPhone({
      userId,
      displayName
    });
  }
}
