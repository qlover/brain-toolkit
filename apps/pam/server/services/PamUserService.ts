import { inject, injectable } from '@shared/container';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import {
  expandSystemPermissions,
  isPlatformAdminRole,
  normalizeSystemRole,
  type SystemRoleType
} from '@shared/auth/systemRole';
import type {
  PamAdminUserListItem,
  PamSessionCapabilities,
  PamUserRow
} from '@schemas/PamUserSchema';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
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
  constructor(@inject(PamUsersRepo) protected readonly repo: PamUsersRepo) {}

  public async ensurePamUser(input: PamUserEnsureInput): Promise<PamUserRow> {
    const row = await this.repo.ensureProfile({
      ...input,
      email: toBusinessEmail(input.email)
    });
    const role = normalizeSystemRole(row.system_role);
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
    return normalizeSystemRole(row?.system_role);
  }

  /** True when system_role has admin.access (operator or admin). */
  public async isPlatformAdmin(userId: string): Promise<boolean> {
    const role = await this.getSystemRole(userId);
    const allowed = isPlatformAdminRole(role);
    setPlatformAdminCache(userId, allowed);
    return allowed;
  }

  public async getCapabilities(
    userId: string
  ): Promise<PamSessionCapabilities> {
    const role = await this.getSystemRole(userId);
    return {
      platformAdmin: isPlatformAdminRole(role),
      roles: [role],
      permissions: [...expandSystemPermissions(role)]
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
    const row = await this.repo.setPlatformAdmin(
      targetUserId,
      enabled,
      actorUserId
    );
    invalidatePlatformAdminCache(targetUserId);
    const role = normalizeSystemRole(row.system_role);
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
