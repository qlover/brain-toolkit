import { inject, injectable } from '@shared/container';
import type { PamAdminUserListItem, PamUserRow } from '@schemas/PamUserSchema';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import {
  invalidatePlatformAdminCache,
  setPlatformAdminCache
} from '@server/utils/platformAdminCache';

export type PamUserEnsureInput = {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string | null;
  readonly phone?: string | null;
};

@injectable()
export class PamUserService {
  constructor(@inject(PamUsersRepo) protected readonly repo: PamUsersRepo) {}

  public async ensurePamUser(input: PamUserEnsureInput): Promise<PamUserRow> {
    const row = await this.repo.ensureProfile(input);
    setPlatformAdminCache(row.id, row.is_platform_admin);
    return row;
  }

  public async isPlatformAdmin(userId: string): Promise<boolean> {
    const row = await this.repo.findById(userId);
    if (!row) {
      return false;
    }
    setPlatformAdminCache(userId, row.is_platform_admin);
    return row.is_platform_admin;
  }

  public async getCapabilities(userId: string): Promise<{
    platformAdmin: boolean;
  }> {
    const platformAdmin = await this.isPlatformAdmin(userId);
    return { platformAdmin };
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
      displayName: row.displayName,
      isPlatformAdmin: row.isPlatformAdmin,
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
    return row;
  }
}
