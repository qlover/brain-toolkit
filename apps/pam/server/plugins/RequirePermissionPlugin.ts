import {
  RequirePermissionPluginBase,
  type PermissionPluginIOC,
  type PermissionSessionUser
} from '@brain-toolkit/next-app-kit/server';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import type { PamPermissionKey } from '@shared/auth/permissionKeys';
import {
  expandSystemPermissions,
  sessionHasSystemPermission
} from '@shared/auth/systemRole';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamPermissionService } from '@server/services/PamPermissionService';
import { PAMService } from '@server/services/PAMService';
import { PamUserService } from '@server/services/PamUserService';

export type RequirePermissionOptions = {
  /**
   * When set, check org/project role permissions for this project id/slug.
   * Omit for system (platform) permission keys.
   */
  projectId?: string;
};

/**
 * Route-layer gate: inject an immutable permission_key.
 *
 * @example
 * ```ts
 * .use(new RequirePermissionPlugin(PermissionKey.admin_users_read))
 * .use(new RequirePermissionPlugin(
 *   PermissionKey.pam_environments_delete,
 *   { projectId }
 * ))
 * ```
 */
export class RequirePermissionPlugin extends RequirePermissionPluginBase {
  constructor(
    permissionKey: PamPermissionKey,
    private readonly options: RequirePermissionOptions = {}
  ) {
    super(permissionKey);
  }

  /**
   * @override
   */
  protected getPermissionService(
    IOC: PermissionPluginIOC
  ): PamPermissionService {
    return IOC(PamPermissionService);
  }

  /**
   * @override
   */
  protected async getSessionUser(
    IOC: PermissionPluginIOC
  ): Promise<PermissionSessionUser | null> {
    const oauth = IOC(OAuthUserService);
    const user = (await oauth.getSessionUser()) ?? (await oauth.getUser(false));
    return (user as PermissionSessionUser | null) ?? null;
  }

  /**
   * @override
   */
  protected async resolveUserPermissions(
    IOC: PermissionPluginIOC,
    userId: string
  ): Promise<readonly string[]> {
    return expandSystemPermissions(
      await IOC(PamUserService).getSystemRole(userId)
    );
  }

  /**
   * @override
   */
  protected createNotAuthorizedError(): Error {
    return new ExecutorError(API_NOT_AUTHORIZED);
  }

  /**
   * @override
   */
  protected override async checkScoped(
    IOC: PermissionPluginIOC
  ): Promise<boolean> {
    const projectId = this.options.projectId?.trim();
    if (!projectId) {
      return false;
    }
    await IOC(PAMService).assertOrgPermission(projectId, this.permissionKey);
    return true;
  }

  /**
   * @override
   */
  protected override checkSession(user: PermissionSessionUser): boolean | null {
    return sessionHasSystemPermission(user, this.permissionKey);
  }
}
