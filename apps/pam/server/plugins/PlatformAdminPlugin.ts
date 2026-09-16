import { PermissionKey } from '@shared/auth/permissionKeys';
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
  }
}
