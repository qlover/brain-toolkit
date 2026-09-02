import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import type { PamAdminUserListItem, PamUserRow } from '@schemas/PamUserSchema';
import { pamPlatformAdminPatchSchema } from '@schemas/PamUserSchema';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamUserService } from '@server/services/PamUserService';

@injectable()
export class AdminUsersController {
  constructor(
    @inject(PamUserService) protected readonly pamUsers: PamUserService,
    @inject(OAuthUserService)
    protected readonly oauthUserService: OAuthUserService
  ) {}

  public async search(query: {
    q?: string | null;
    limit?: string | null;
    offset?: string | null;
  }): Promise<PamAdminUserListItem[]> {
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1),
      50
    );
    const offset = Math.max(Number.parseInt(query.offset ?? '0', 10) || 0, 0);

    return this.pamUsers.searchAdminUsers({
      query: query.q ?? undefined,
      limit,
      offset
    });
  }

  public async setPlatformAdmin(
    targetUserId: string,
    body: unknown
  ): Promise<PamUserRow> {
    const actor = await this.oauthUserService.getSessionUser();
    if (!actor?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Not authorized');
    }

    const parsed = pamPlatformAdminPatchSchema.parse(body);
    return this.pamUsers.setPlatformAdmin(
      targetUserId,
      parsed.enabled,
      actor.id
    );
  }
}
