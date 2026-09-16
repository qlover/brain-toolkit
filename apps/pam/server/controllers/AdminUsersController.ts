import { ExecutorError } from '@qlover/fe-corekit/executor';
import type { SystemRoleType } from '@shared/auth/systemRole';
import { inject, injectable } from '@shared/container';
import {
  API_ADMIN_USERS_CANNOT_CHANGE_SELF,
  API_NOT_AUTHORIZED
} from '@config/i18n-identifier/api';
import type { PamAdminUserListItem, PamUserRow } from '@schemas/PamUserSchema';
import {
  pamPlatformAdminPatchSchema,
  pamSystemRolePatchSchema
} from '@schemas/PamUserSchema';
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

  /** @deprecated Prefer setSystemRole */
  public async setPlatformAdmin(
    targetUserId: string,
    body: unknown
  ): Promise<PamUserRow> {
    const actor = await this.requireActorId();
    this.assertNotSelf(targetUserId, actor);
    const parsed = pamPlatformAdminPatchSchema.parse(body);
    return this.pamUsers.setPlatformAdmin(targetUserId, parsed.enabled, actor);
  }

  public async setSystemRole(
    targetUserId: string,
    body: unknown
  ): Promise<PamUserRow> {
    const actor = await this.requireActorId();
    this.assertNotSelf(targetUserId, actor);
    const parsed = pamSystemRolePatchSchema.parse(body);
    return this.pamUsers.setSystemRole(
      targetUserId,
      parsed.systemRole as SystemRoleType,
      actor
    );
  }

  protected assertNotSelf(targetUserId: string, actorUserId: string): void {
    if (targetUserId === actorUserId) {
      throw new ExecutorError(
        API_ADMIN_USERS_CANNOT_CHANGE_SELF,
        'Cannot change your own system role'
      );
    }
  }

  protected async requireActorId(): Promise<string> {
    const actor = await this.oauthUserService.getSessionUser();
    if (!actor?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Not authorized');
    }
    return actor.id;
  }
}
