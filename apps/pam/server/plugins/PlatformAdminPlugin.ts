import { ExecutorError } from '@qlover/fe-corekit/executor';
import { permissionUid } from '@shared/auth/permissionUid';
import { API_ADMIN_SITE_SETTINGS } from '@config/apiRoutes';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamUserService } from '@server/services/PamUserService';
import { RequirePermissionPlugin } from './RequirePermissionPlugin';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Requires session + admin console gate uid (`get_/api/admin/site-settings`).
 * Prefer {@link RequirePermissionPlugin} with a specific API uid on new routes.
 */
export class PlatformAdminPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'PlatformAdminPlugin';

  private readonly inner = new RequirePermissionPlugin(
    permissionUid('GET', API_ADMIN_SITE_SETTINGS)
  );

  /**
   * @override
   */
  public async onBefore(context: BootstrapServerContext): Promise<void> {
    await this.inner.onBefore(context);

    const { IOC } = context.parameters;
    const user = await IOC(OAuthUserService).getSessionUser();
    if (!user?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Platform admin required');
    }
    await IOC(PamUserService).isPlatformAdmin(user.id);
  }
}
