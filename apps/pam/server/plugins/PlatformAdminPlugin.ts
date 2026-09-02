import { ExecutorError } from '@qlover/fe-corekit/executor';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamUserService } from '@server/services/PamUserService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Requires an authenticated session **and** platform admin (`pam_users.is_platform_admin`).
 *
 * Apply to `/api/admin/**` routes. Returns 403 JSON (does not redirect).
 */
export class PlatformAdminPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'PlatformAdminPlugin';

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    const oauthUserService = IOC(OAuthUserService);
    await oauthUserService.throwIfNotAuth();

    const user = await oauthUserService.getSessionUser();
    if (!user?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Platform admin required');
    }

    const isAdmin = await IOC(PamUserService).isPlatformAdmin(user.id);
    if (!isAdmin) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Platform admin required');
    }
  }
}
