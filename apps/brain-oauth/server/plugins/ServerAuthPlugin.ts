import type { BrainOAuthServerIocMap } from '@server/BootstrapServer';
import { OAuthUserService } from '@server/services/OAuthUserService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

export class ServerAuthPlugin
  implements BootstrapServerPlugin<BrainOAuthServerIocMap>
{
  public readonly pluginName = 'ServerAuthPlugin';

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext<BrainOAuthServerIocMap>): Promise<void> {
    await IOC(OAuthUserService).throwIfNotAuth();
  }
}
