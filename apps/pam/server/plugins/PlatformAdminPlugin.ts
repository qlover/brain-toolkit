import { ExecutorError } from '@qlover/fe-corekit/executor';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { PamUserService } from '@server/services/PamUserService';
import { RequirePermissionPlugin } from './RequirePermissionPlugin';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Requires session + admin console gate (`admin_site_settings_read`).
 * Prefer {@link RequirePermissionPlugin} with a specific permission key on new routes.
 */
export class PlatformAdminPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'PlatformAdminPlugin';

  private readonly inner = new RequirePermissionPlugin(
    PermissionKey.admin_site_settings_read
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
