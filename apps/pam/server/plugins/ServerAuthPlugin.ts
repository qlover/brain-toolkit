import { OAuthUserService } from '@server/services/OAuthUserService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Requires an authenticated app session (browser cookie **or** CLI bearer).
 *
 * Significance: Blocks anonymous access to protected JSON APIs.
 * Core idea: Delegate to {@link OAuthUserService.throwIfNotAuth}.
 * Main function: Fail the request before the controller runs when logged out.
 * Main purpose: Shared gate for web UI and CLI on the same routes.
 *
 * For CLI-**only** endpoints (must present a pam-cli JWT), use
 * {@link PamCliAuthPlugin} instead.
 */
export class ServerAuthPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'ServerAuthPlugin';

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    await IOC(OAuthUserService).throwIfNotAuth();
  }
}
