import { ExecutorError } from '@qlover/fe-corekit/executor';
import { hasSystemPermission } from '@shared/auth/systemRole';
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
   * Omit for system (platform) permission uids.
   */
  projectId?: string;
};

/**
 * Route-layer gate: inject an immutable API permission uid.
 *
 * @example
 * ```ts
 * .use(new RequirePermissionPlugin(permissionUid('GET', API_ADMIN_USERS)))
 * .use(new RequirePermissionPlugin(
 *   permissionUid('POST', API_PAM_ENVIRONMENTS_DELETE),
 *   { projectId }
 * ))
 * ```
 */
export class RequirePermissionPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'RequirePermissionPlugin';

  constructor(
    private readonly uid: string,
    private readonly options: RequirePermissionOptions = {}
  ) {}

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    await IOC(OAuthUserService).throwIfNotAuth();
    await IOC(PamPermissionService).ensureLoaded();

    const projectId = this.options.projectId?.trim();
    if (projectId) {
      await IOC(PAMService).assertOrgPermission(projectId, this.uid);
      return;
    }

    const user = await IOC(OAuthUserService).getSessionUser();
    if (!user?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const role = await IOC(PamUserService).getSystemRole(user.id);
    if (!hasSystemPermission(role, this.uid)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
  }
}
