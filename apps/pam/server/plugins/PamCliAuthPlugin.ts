import { ExecutorError } from '@qlover/fe-corekit/executor';
import { headers } from 'next/headers';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { PamCliTokenService } from '@server/services/PamCliTokenService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

/**
 * Requires a valid PAM CLI bearer token (`Authorization: Bearer …`).
 *
 * Significance: Mirrors {@link ServerAuthPlugin} for headless CLI callers.
 * Core idea: Verify `typ/aud/jti` via {@link PamCliTokenService} before handlers.
 * Main function: Reject requests that are not authenticated as pam-cli.
 * Main purpose: Make CLI auth explicit on CLI-oriented API routes.
 *
 * Prefer this on `/api/pam/cli/*` (except public token/device endpoints) and
 * CLI-only export paths. Shared web+CLI routes should keep {@link ServerAuthPlugin}
 * (cookie **or** CLI bearer via session resolution).
 *
 * @example
 * new NextApiServer(route, req).use(new PamCliAuthPlugin()).runWithJson(...)
 */
export class PamCliAuthPlugin implements BootstrapServerPlugin {
  public readonly pluginName = 'PamCliAuthPlugin';

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    const authorization = (await headers()).get('authorization');
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'CLI bearer token required');
    }

    const token = authorization.slice('bearer '.length).trim();
    if (!token) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'CLI bearer token required');
    }

    const session = await IOC(PamCliTokenService).verifyToken(token);
    if (!session?.userId) {
      throw new ExecutorError(
        API_NOT_AUTHORIZED,
        'Invalid or revoked CLI token'
      );
    }
  }
}
