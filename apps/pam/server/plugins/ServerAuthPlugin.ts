import { OAuthUserService } from '@server/services/OAuthUserService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

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
