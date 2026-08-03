import { API_PAM_CLI_DEVICE_APPROVE } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/cli/device/approve — browser session approves CLI login.
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CLI_DEVICE_APPROVE, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamCliController).approveDeviceCode(req);
    });
}
