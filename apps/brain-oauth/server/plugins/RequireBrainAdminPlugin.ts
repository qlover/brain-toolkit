import { ExecutorError } from '@qlover/fe-corekit';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Route-layer gate for admin-only APIs: requires a Brain admin session.
 *
 * @example
 * ```ts
 * .use(new RequireBrainAdminPlugin())
 * ```
 */
export class RequireBrainAdminPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'RequireBrainAdminPlugin';

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    const provider = IOC(
      I.OAuthWrapperProviderInterface
    ) as OAuthWrapperProviderInterface;
    const user = await provider.getUserSchema();
    if (!user?.id || !isBrainAdminUser(user)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
  }
}
