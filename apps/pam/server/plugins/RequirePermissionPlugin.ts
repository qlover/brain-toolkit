import { ExecutorError } from '@qlover/fe-corekit/executor';
import type { PamPermissionKey } from '@shared/auth/permissionKeys';
import {
  hasSystemPermission,
  sessionHasSystemPermission
} from '@shared/auth/systemRole';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamPermissionService } from '@server/services/PamPermissionService';
import { PAMService } from '@server/services/PAMService';
import { PamUserService } from '@server/services/PamUserService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

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
export class RequirePermissionPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'RequirePermissionPlugin';

  constructor(
    private readonly permissionKey: PamPermissionKey,
    private readonly options: RequirePermissionOptions = {}
  ) {}

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    await IOC(PamPermissionService).ensureLoaded();

    const projectId = this.options.projectId?.trim();
    if (projectId) {
      await IOC(PAMService).assertOrgPermission(projectId, this.permissionKey);
      return;
    }

    const oauth = IOC(OAuthUserService);
    const user = (await oauth.getSessionUser()) ?? (await oauth.getUser(false));
    if (!user?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const fromSession = sessionHasSystemPermission(user, this.permissionKey);
    if (fromSession === true) {
      return;
    }
    if (fromSession === false) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const role = await IOC(PamUserService).getSystemRole(user.id);
    if (!hasSystemPermission(role, this.permissionKey)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
  }
}
