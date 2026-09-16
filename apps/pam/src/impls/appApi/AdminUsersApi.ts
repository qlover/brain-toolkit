import type { SystemRoleType } from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import {
  API_ADMIN_USERS,
  API_ADMIN_USERS_SYSTEM_ROLE
} from '@config/apiRoutes';
import type { PamAdminUserListItem } from '@schemas/PamUserSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

function buildSystemRolePath(userId: string): string {
  return API_ADMIN_USERS_SYSTEM_ROLE.replace(
    ':userId',
    encodeURIComponent(userId)
  );
}

@injectable()
export class AdminUsersApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async search(params: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<PamAdminUserListItem[]> {
    const response = await this.appApiRequester.get(API_ADMIN_USERS, {
      params: {
        q: params.q ?? '',
        limit: params.limit ?? 20,
        offset: params.offset ?? 0
      }
    });

    const envelope = response.data as NextKitApiSuccess<PamAdminUserListItem[]>;
    return envelope.data ?? [];
  }

  public async setSystemRole(
    userId: string,
    systemRole: SystemRoleType
  ): Promise<void> {
    await this.appApiRequester.patch(buildSystemRolePath(userId), {
      systemRole
    });
  }

  /** @deprecated Prefer setSystemRole */
  public async setPlatformAdmin(
    userId: string,
    enabled: boolean
  ): Promise<void> {
    await this.setSystemRole(userId, enabled ? 'admin' : 'user');
  }
}
