import { inject, injectable } from '@shared/container';
import { API_ADMIN_USERS } from '@config/route';
import type { PamAdminUserListItem } from '@schemas/PamUserSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

function buildPlatformAdminPath(userId: string): string {
  return `${API_ADMIN_USERS}/${encodeURIComponent(userId)}/platform-admin`;
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

  public async setPlatformAdmin(
    userId: string,
    enabled: boolean
  ): Promise<void> {
    await this.appApiRequester.patch(buildPlatformAdminPath(userId), {
      enabled
    });
  }
}
